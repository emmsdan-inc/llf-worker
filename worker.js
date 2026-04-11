"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/workers/worker.ts
var import_express = __toESM(require("express"));
var import_bullmq = require("bullmq");

// src/services/queue/config.ts
var import_ioredis = __toESM(require("ioredis"));
var DEFAULT_QUEUE_NAME = "llf-tasks";
var DEFAULT_WORKER_CONCURRENCY = 5;
function getRedisUrl() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error("Missing REDIS_URL environment variable");
  }
  return redisUrl;
}
function getQueueName() {
  return process.env.QUEUE_NAME || DEFAULT_QUEUE_NAME;
}
function getWorkerConcurrency() {
  const value = Number(process.env.QUEUE_WORKER_CONCURRENCY ?? DEFAULT_WORKER_CONCURRENCY);
  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_WORKER_CONCURRENCY;
  }
  return Math.floor(value);
}
function createRedisConnection(redisUrl = getRedisUrl()) {
  return new import_ioredis.default(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false
  });
}

// src/services/queue/tasks/schemas.ts
var import_zod = require("zod");
var emailTemplateSchema = import_zod.z.enum([
  "welcome",
  "payment-receipt",
  "billing-reminder",
  "class-enrollment",
  "class-reminder",
  "attendance-alert",
  "child-profile-added",
  "assignment-reminder",
  "weekly-report",
  "password-reset",
  "password-changed",
  "enrollment-confirmation",
  "assignment-submitted",
  "assignment-graded",
  "tutor-admin-update"
]);
var emailTaskPayloadSchema = import_zod.z.object({
  to: import_zod.z.string().email(),
  template: emailTemplateSchema,
  data: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()),
  cc: import_zod.z.array(import_zod.z.string().email()).optional(),
  bcc: import_zod.z.array(import_zod.z.string().email()).optional(),
  provider: import_zod.z.enum(["smtp", "zeptomail", "mock"]).optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).optional()
});
var updateStatsPayloadSchema = import_zod.z.object({
  metric: import_zod.z.string().min(1),
  delta: import_zod.z.number().optional(),
  memberId: import_zod.z.string().optional(),
  metadata: import_zod.z.record(import_zod.z.string(), import_zod.z.unknown()).optional()
});
var externalApiPayloadSchema = import_zod.z.object({
  url: import_zod.z.string().url(),
  method: import_zod.z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).optional(),
  body: import_zod.z.unknown().optional(),
  headers: import_zod.z.record(import_zod.z.string(), import_zod.z.string()).optional()
});

// src/workers/handlers/callExternalApi.ts
var callExternalApiHandler = async (job) => {
  const { type, payload, appId } = job.data;
  const parsed = externalApiPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid call_external_api payload: ${parsed.error.message}`);
  }
  console.info("[queue-worker] call_external_api", {
    type,
    payload: parsed.data,
    appId,
    jobId: job.id
  });
};

// src/services/email/email.renderer.ts
var import_render = require("@react-email/render");

// src/services/email/templates/layout/default.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var styles = {
  body: {
    margin: 0,
    padding: "48px 0",
    backgroundColor: "#f8fafc",
    // Light slate background
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    WebkitFontSmoothing: "antialiased"
  },
  wrapper: {
    width: "100%",
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    borderRadius: "4px",
    // Subtle rounding for a more serious look
    border: "1px solid #e2e8f0"
  },
  topAccent: {
    height: "3px",
    backgroundColor: "#542e66"
    // Solid dark navy/black for authority
  },
  header: {
    padding: "40px 40px 24px",
    textAlign: "left"
  },
  title: {
    margin: 0,
    color: "#542e66",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.2
  },
  content: {
    padding: "0 40px 48px",
    lineHeight: 1.6,
    fontSize: "15px",
    color: "#242323"
  },
  footer: {
    padding: "32px 40px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: "12px",
    borderTop: "1px solid #e2e8f0"
  },
  platformName: {
    color: "#542e66",
    fontWeight: 600,
    fontSize: "13px",
    marginBottom: "4px",
    display: "block"
  }
};
function EmailLayout({ title, previewText, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", { lang: "en", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("head", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("meta", { httpEquiv: "Content-Type", content: "text/html; charset=UTF-8" }),
      previewText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { display: "none", maxHeight: 0, overflow: "hidden" }, children: previewText }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("title", { children: title })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("body", { style: styles.body, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", { role: "presentation", cellPadding: 0, cellSpacing: 0, width: "100%", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { align: "center", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { role: "presentation", style: styles.wrapper, width: "100%", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: styles.topAccent }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: styles.header, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { style: styles.title, children: title }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { style: styles.content, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { color: "#242323" }, children }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", { style: styles.footer, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: styles.platformName, children: "Leading Ladies Foundation" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { style: { margin: 0, lineHeight: 1.5 }, children: "This communication contains important account or course information. Please do not reply directly to this automated message." })
      ] }) })
    ] }) }) }) }) })
  ] });
}

// src/services/email/templates/assignment-graded.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function AssignmentGradedTemplate({
  recipientName,
  studentName,
  assignmentTitle,
  className,
  score,
  scorePercentage,
  passed,
  feedback,
  actionUrl
}) {
  const subjectLabel = studentName ? `${studentName}'s` : "Your";
  const passedColor = passed === true ? "#16a34a" : passed === false ? "#dc2626" : "#64748b";
  const passedLabel = passed === true ? "Passed" : passed === false ? "Not passed" : null;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    EmailLayout,
    {
      title: "Daily Exercise Graded",
      previewText: `${subjectLabel} submission for "${assignmentTitle}" has been graded.`,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
          "Hi ",
          recipientName,
          ","
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: studentName ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: studentName }),
          "'s daily exercise submission for ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: assignmentTitle }),
          " has been graded."
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
          "Your daily exercise submission for ",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: assignmentTitle }),
          " has been graded."
        ] }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("ul", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Class:" }),
            " ",
            className
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Score:" }),
            " ",
            score
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Percentage:" }),
            " ",
            scorePercentage
          ] }),
          passedLabel ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { style: { color: passedColor }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Result:" }),
            " ",
            passedLabel
          ] }) : null
        ] }),
        feedback ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px 16px", marginTop: "16px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: "Tutor Feedback:" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { marginTop: "8px", marginBottom: 0 }, children: feedback })
        ] }) : null,
        actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { style: { marginTop: "16px" }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 }, children: "View full results" }) }) : null
      ]
    }
  );
}

// src/services/email/templates/assignment-reminder.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function AssignmentReminderTemplate({ recipientName, studentName, assignmentTitle, className, dueDate, actionUrl }) {
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(EmailLayout, { title: "Daily Exercise Reminder", previewText: "A new daily exercise is available.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: studentName ? `${studentName} has a new daily exercise.` : "A new daily exercise has been created." }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { children: [
        "Daily Exercise: ",
        assignmentTitle
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { children: [
        "Class: ",
        className
      ] }),
      dueDate ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("li", { children: [
        "Due Date: ",
        dueDate
      ] }) : null
    ] }),
    actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("p", { children: [
      "Open daily exercise: ",
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("a", { href: actionUrl, children: actionUrl })
    ] }) : null
  ] });
}

// src/services/email/templates/assignment-submitted.tsx
var import_jsx_runtime4 = require("react/jsx-runtime");
function AssignmentSubmittedTemplate({
  recipientName,
  studentName,
  assignmentTitle,
  className,
  submittedAt,
  isLate,
  actionUrl
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(EmailLayout, { title: "Daily Exercise Submitted", previewText: `${studentName} has submitted "${assignmentTitle}".`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: studentName }),
      " has submitted a daily exercise and is awaiting your review."
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "Daily Exercise:" }),
        " ",
        assignmentTitle
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "Class:" }),
        " ",
        className
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "Submitted At:" }),
        " ",
        submittedAt
      ] }),
      isLate ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("li", { style: { color: "#dc2626" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("strong", { children: "Note:" }),
        " This submission was late."
      ] }) : null
    ] }),
    actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 }, children: "Review submission" }) }) : null
  ] });
}

// src/services/email/templates/billing-reminder.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
function BillingReminderTemplate({
  recipientName,
  studentName,
  className,
  amount,
  dueDate,
  graceEndsAt,
  reminderType
}) {
  const isFinal = reminderType === "final";
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    EmailLayout,
    {
      title: isFinal ? "Final Payment Reminder" : "Payment Reminder",
      previewText: isFinal ? "Your class access will be locked if payment is not received." : "Your monthly subscription payment is due today.",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          "Hi ",
          recipientName,
          ","
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: isFinal ? "This is your final reminder before class access is locked for unpaid billing." : "Your monthly subscription payment is due today." }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("ul", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            "Student: ",
            studentName
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            "Class: ",
            className
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            "Amount Due: ",
            amount
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            "Due Date: ",
            dueDate
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("li", { children: [
            "Grace Ends: ",
            graceEndsAt
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: isFinal ? "Please make sure payment is completed before the grace period ends to avoid loss of access to live class links." : "If the automatic debit does not go through today, the 5-day grace window stays open until the date above." }),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "Thank you for choosing LLF." })
      ]
    }
  );
}

// src/services/email/templates/class-attendance-alert.tsx
var import_jsx_runtime6 = require("react/jsx-runtime");
function ClassAttendanceAlertTemplate({
  recipientName,
  studentName,
  className,
  scheduledAt,
  alertType,
  meetingLink
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(EmailLayout, { title: "Attendance Alert", previewText: "A student is late and attendance is still missing.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: alertType === "late-no-attendance" ? `${studentName} is now 10 minutes late for class and attendance has not been marked as present.` : `${studentName} has an attendance alert.` }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
        "Class: ",
        className
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
        "Scheduled time: ",
        scheduledAt
      ] })
    ] }),
    meetingLink ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { children: [
      "Join class now: ",
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("a", { href: meetingLink, children: meetingLink })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "Please check in and join the class immediately if possible." })
  ] });
}

// src/services/email/templates/child-profile-added.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function ChildProfileAddedTemplate({
  parentName,
  childName,
  childEmail,
  relationship,
  createdAt
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(EmailLayout, { title: "Child Profile Added", previewText: "A new child profile was added to your parent account.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("p", { children: [
      "Hi ",
      parentName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "A new child profile was added to your account." }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        "Child name: ",
        childName
      ] }),
      childEmail ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        "Child email: ",
        childEmail
      ] }) : null,
      relationship ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        "Relationship/Gender: ",
        relationship
      ] }) : null,
      createdAt ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("li", { children: [
        "Created at: ",
        createdAt
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("p", { children: "If you did not make this change, contact support immediately." })
  ] });
}

// src/services/email/templates/class-enrollment.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
function ClassEnrollmentTemplate({
  recipientName,
  studentName,
  className,
  classVariantName,
  startDate,
  tutorName,
  note
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(EmailLayout, { title: "Class Enrollment Update", previewText: "A new enrollment has been recorded.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "A new enrollment has been recorded." }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
        "Student: ",
        studentName
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
        "Class: ",
        className
      ] }),
      classVariantName ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
        "Variant: ",
        classVariantName
      ] }) : null,
      startDate ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
        "Start Date: ",
        startDate
      ] }) : null,
      tutorName ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("li", { children: [
        "Tutor: ",
        tutorName
      ] }) : null
    ] }),
    note ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: note }) : null
  ] });
}

// src/services/email/templates/class-reminder.tsx
var import_jsx_runtime9 = require("react/jsx-runtime");
function ClassReminderTemplate({ recipientName, className, startsAt, tutorName, meetingLink }) {
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(EmailLayout, { title: "Class Reminder", previewText: "Your class starts soon.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("p", { children: "This is a reminder for your upcoming class." }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("li", { children: [
        "Class: ",
        className
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("li", { children: [
        "Starts: ",
        startsAt
      ] }),
      tutorName ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("li", { children: [
        "Tutor: ",
        tutorName
      ] }) : null
    ] }),
    meetingLink ? /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("p", { children: [
      "Join link: ",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("a", { href: meetingLink, children: meetingLink })
    ] }) : null
  ] });
}

// src/services/email/templates/enrollment-confirmation.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
function EnrollmentConfirmationTemplate({
  parentName,
  studentName,
  className,
  classVariantName,
  startDate,
  tutorName,
  actionUrl
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(EmailLayout, { title: "Enrollment Confirmed", previewText: `${studentName} is now enrolled in ${className}.`, children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
      "Hi ",
      parentName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
      "Great news! ",
      /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: studentName }),
      " has been successfully enrolled in the following class:"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: "Class:" }),
        " ",
        className
      ] }),
      classVariantName ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: "Schedule:" }),
        " ",
        classVariantName
      ] }) : null,
      startDate ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: "Start Date:" }),
        " ",
        startDate
      ] }) : null,
      tutorName ? /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("strong", { children: "Tutor:" }),
        " ",
        tutorName
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("p", { children: [
      "We look forward to seeing ",
      studentName,
      " in class. If you have any questions, feel free to reach out."
    ] }),
    actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 }, children: "View class details" }) }) : null
  ] });
}

// src/services/email/templates/password-changed.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
function PasswordChangedTemplate({ recipientName, changedAt, supportEmail }) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
    EmailLayout,
    {
      title: "Password Updated",
      previewText: "This confirms your account password was changed.",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "Hi ",
          recipientName,
          ","
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "Your account password was changed successfully on ",
          changedAt,
          "."
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "If you made this change, no further action is needed." }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "If you did not make this change, please reset your password immediately and contact support",
          supportEmail ? ` at ${supportEmail}` : "",
          "."
        ] })
      ]
    }
  );
}

// src/services/email/templates/password-reset.tsx
var import_jsx_runtime12 = require("react/jsx-runtime");
function PasswordResetTemplate({ recipientName, resetUrl, expiresInMinutes = 30 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(EmailLayout, { title: "Password Reset", previewText: "Reset your password securely.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("p", { children: "We received a request to reset your password." }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
      "Reset link: ",
      /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("a", { href: resetUrl, children: resetUrl })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)("p", { children: [
      "This link expires in ",
      expiresInMinutes,
      " minutes."
    ] })
  ] });
}

// src/services/email/templates/payment-receipt.tsx
var import_jsx_runtime13 = require("react/jsx-runtime");
function PaymentReceiptTemplate({
  parentName,
  childName,
  className,
  amount,
  currency = "NGN",
  paidAt,
  receiptRef
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)(EmailLayout, { title: "Payment Receipt", previewText: "Your payment was successful.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("p", { children: [
      "Hi ",
      parentName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "We\u2019ve received your payment successfully." }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("ul", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { children: [
        "Student: ",
        childName
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { children: [
        "Class: ",
        className
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { children: [
        "Amount: ",
        amount,
        " ",
        currency
      ] }),
      receiptRef ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { children: [
        "Reference: ",
        receiptRef
      ] }) : null,
      paidAt ? /* @__PURE__ */ (0, import_jsx_runtime13.jsxs)("li", { children: [
        "Paid At: ",
        paidAt
      ] }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime13.jsx)("p", { children: "Thank you for choosing LLF." })
  ] });
}

// src/services/email/templates/tutor-admin-update.tsx
var import_jsx_runtime14 = require("react/jsx-runtime");
function TutorAdminUpdateTemplate({
  tutorName,
  loginEmail,
  temporaryPassword,
  action,
  changes
}) {
  const title = action === "created" ? "Tutor Account Created" : action === "verification-updated" ? "Tutor Verification Updated" : "Tutor Profile Updated";
  const previewText = action === "created" ? "Your tutor account has been created by an admin." : action === "verification-updated" ? "Your verification status has been updated by an admin." : "Your tutor profile has been updated by an admin.";
  return /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(EmailLayout, { title, previewText, children: [
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
      "Hi ",
      tutorName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
      "An administrator just ",
      action === "created" ? "created" : "updated",
      " your tutor account."
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
      "Login email: ",
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: loginEmail })
    ] }),
    temporaryPassword ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)("p", { children: [
      "Temporary password: ",
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("strong", { children: temporaryPassword })
    ] }) : null,
    changes.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime14.jsxs)(import_jsx_runtime14.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: "Changes made:" }),
      /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("ul", { children: changes.map((change) => /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("li", { children: change }, change)) })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime14.jsx)("p", { children: "If you did not expect this update, please contact support immediately." })
  ] });
}

// src/services/email/templates/weekly-report.tsx
var import_jsx_runtime15 = require("react/jsx-runtime");
function WeeklyReportTemplate({ recipientName, weekLabel, summaryItems, actionUrl }) {
  return /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)(EmailLayout, { title: "Weekly Progress Report", previewText: "Your weekly report is ready.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("p", { children: [
      "Hi ",
      recipientName,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("p", { children: [
      "Here is your summary for ",
      weekLabel,
      ":"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("ul", { children: summaryItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("li", { children: item }, item)) }),
    actionUrl ? /* @__PURE__ */ (0, import_jsx_runtime15.jsxs)("p", { children: [
      "View details: ",
      /* @__PURE__ */ (0, import_jsx_runtime15.jsx)("a", { href: actionUrl, children: actionUrl })
    ] }) : null
  ] });
}

// src/services/email/templates/welcome.tsx
var import_jsx_runtime16 = require("react/jsx-runtime");
function WelcomeTemplate({ name, role = "membership", dashboardUrl }) {
  return /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)(EmailLayout, { title: "Welcome to LLF", previewText: "Your account has been created successfully.", children: [
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
      "Hi ",
      name,
      ","
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
      "Welcome to LLF. Your ",
      role,
      " account is now active."
    ] }),
    dashboardUrl ? /* @__PURE__ */ (0, import_jsx_runtime16.jsxs)("p", { children: [
      "Get started here: ",
      /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("a", { href: dashboardUrl, children: dashboardUrl })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime16.jsx)("p", { children: "We\u2019re glad to have you onboard." })
  ] });
}

// src/services/email/registry/template.registry.ts
var templateRegistry = {
  welcome: {
    subject: () => "Welcome to LLF",
    previewText: () => "Your account is ready.",
    component: (data) => WelcomeTemplate(data)
  },
  "member-registration": {
    subject: () => "Welcome to LLF",
    previewText: () => "Your account is ready.",
    component: (data) => WelcomeTemplate(data)
  },
  "payment-receipt": {
    subject: (data) => `Payment receipt for ${data.className}`,
    previewText: () => "Payment completed successfully.",
    component: (data) => PaymentReceiptTemplate(data)
  },
  "billing-reminder": {
    subject: (data) => data.reminderType === "final" ? `Final payment reminder for ${data.className}` : `Payment due today for ${data.className}`,
    previewText: (data) => data.reminderType === "final" ? "Your class access will lock soon if payment is not received." : "Your subscription payment is due today.",
    component: (data) => BillingReminderTemplate(data)
  },
  "class-enrollment": {
    subject: (data) => `Enrollment update: ${data.className}`,
    previewText: () => "New class enrollment recorded.",
    component: (data) => ClassEnrollmentTemplate(data)
  },
  "class-reminder": {
    subject: (data) => `Reminder: ${data.className}`,
    previewText: () => "Class starts soon.",
    component: (data) => ClassReminderTemplate(data)
  },
  "attendance-alert": {
    subject: (data) => `Attendance alert: ${data.className}`,
    previewText: () => "A student is late and attendance has not been marked yet.",
    component: (data) => ClassAttendanceAlertTemplate(data)
  },
  "child-profile-added": {
    subject: (data) => `Child profile added: ${data.childName}`,
    previewText: () => "A new child profile has been added to your account.",
    component: (data) => ChildProfileAddedTemplate(data)
  },
  "assignment-reminder": {
    subject: (data) => `Daily Exercise: ${data.assignmentTitle}`,
    previewText: () => "A new daily exercise is available.",
    component: (data) => AssignmentReminderTemplate(data)
  },
  "weekly-report": {
    subject: (data) => `Weekly report: ${data.weekLabel}`,
    previewText: () => "Your weekly summary is ready.",
    component: (data) => WeeklyReportTemplate(data)
  },
  "password-reset": {
    subject: () => "Reset your password",
    previewText: () => "Use this link to reset your password.",
    component: (data) => PasswordResetTemplate(data)
  },
  "password-changed": {
    subject: () => "Your password was changed",
    previewText: () => "Your account password has been updated successfully.",
    component: (data) => PasswordChangedTemplate(data)
  },
  "enrollment-confirmation": {
    subject: (data) => `Enrollment confirmed: ${data.className}`,
    previewText: (data) => `${data.studentName} is now enrolled in ${data.className}.`,
    component: (data) => EnrollmentConfirmationTemplate(data)
  },
  "assignment-submitted": {
    subject: (data) => `Daily Exercise submitted: ${data.assignmentTitle}`,
    previewText: (data) => `${data.studentName} has submitted "${data.assignmentTitle}".`,
    component: (data) => AssignmentSubmittedTemplate(data)
  },
  "assignment-graded": {
    subject: (data) => `Daily Exercise graded: ${data.assignmentTitle}`,
    previewText: (data) => `Results are available for "${data.assignmentTitle}".`,
    component: (data) => AssignmentGradedTemplate(data)
  },
  "tutor-admin-update": {
    subject: (data) => {
      if (data.action === "created") {
        return "Your tutor account has been created";
      }
      if (data.action === "verification-updated") {
        return "Your tutor verification status was updated";
      }
      return "Your tutor profile has been updated";
    },
    previewText: (data) => {
      if (data.action === "created") {
        return "An admin created your account and shared your login details.";
      }
      if (data.action === "verification-updated") {
        return "Your tutor verification status has changed.";
      }
      return "An admin updated your tutor profile information.";
    },
    component: (data) => TutorAdminUpdateTemplate(data)
  }
};

// src/services/email/email.renderer.ts
async function renderEmail(template, data) {
  const definition = templateRegistry[template];
  const subject = definition.subject(data);
  const previewText = definition.previewText?.(data);
  const htmlBody = await (0, import_render.render)(definition.component(data));
  const html = `<!doctype html>${htmlBody}`;
  console.log("Rendered HTML:", "html");
  const text = (0, import_render.toPlainText)(htmlBody);
  console.log("Rendered Text:", "text");
  return {
    template,
    subject,
    html,
    text,
    previewText
  };
}

// src/env.ts
var import_config = require("dotenv/config");
var z2 = __toESM(require("zod"));
var serverSchema = z2.object({
  NODE_ENV: z2.enum(["development", "production", "test"]).default("development"),
  NEXT_RUNTIME: z2.enum(["edge", "nodejs", "experimental-edge"]).optional(),
  DATABASE_URL: z2.string().trim().min(1),
  DIRECT_URL: z2.string().trim().optional(),
  NEXTAUTH_URL: z2.string().trim().url(),
  NEXTAUTH_SECRET: z2.string().trim().min(1),
  REDIS_URL: z2.string().trim(),
  QUEUE_NAME: z2.string().trim().default("llf-tasks"),
  QUEUE_WORKER_CONCURRENCY: z2.coerce.number().int().min(1).default(5),
  QUEUE_LOG_SINK: z2.enum(["database", "mixpanel", "both", "none"]).default("both"),
  EMAIL_FROM_NAME: z2.string().trim().min(1),
  EMAIL_FROM_EMAIL: z2.email().trim().min(1),
  EMAIL_PROVIDER: z2.enum(["smtp", "zeptomail", "mock"]).default("smtp"),
  SMTP_HOST: z2.string().trim().min(1),
  SMTP_PORT: z2.coerce.number().int().min(1).default(465),
  SMTP_USERNAME: z2.string().trim().min(1),
  SMTP_PASSWORD: z2.string().trim().min(1),
  SMTP_SECURE: z2.coerce.boolean().default(true),
  VERCEL_TOKEN: z2.string().trim().optional(),
  VERCEL_ORG_ID: z2.string().trim().optional(),
  VERCEL_PROJECT_ID: z2.string().trim().optional(),
  ZEPTO_API_KEY: z2.string().trim().optional(),
  ZEPTO_BASE_URL: z2.string().trim().url().optional(),
  MIXPANEL_TOKEN: z2.string().trim().optional()
});
var isServer = typeof window === "undefined";
var env = isServer ? serverSchema.parse(process.env) : {};

// src/services/email/providers/mock.provider.ts
var MockMailProvider = class {
  async send(input) {
    console.info("[email:mock] send", {
      to: input.to,
      subject: input.subject,
      cc: input.cc,
      bcc: input.bcc
    });
    return {
      providerMessageId: `mock-${Date.now()}`,
      accepted: [input.to],
      rejected: []
    };
  }
};
var mockMailProvider = new MockMailProvider();

// src/services/email/providers/smtp.provider.ts
var import_nodemailer = __toESM(require("nodemailer"));
var transporter = null;
function getTransporter() {
  if (transporter) {
    return transporter;
  }
  if (!env.SMTP_HOST || !env.SMTP_PORT || !env.SMTP_USERNAME || !env.SMTP_PASSWORD) {
    throw new Error("SMTP provider selected but SMTP credentials are incomplete.");
  }
  transporter = import_nodemailer.default.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD
    }
  });
  return transporter;
}
var SmtpMailProvider = class {
  async send(input) {
    const tx = getTransporter();
    const from = input.fromName ? `${input.fromName} <${input.fromEmail}>` : input.fromEmail;
    const result = await tx.sendMail({
      from,
      to: input.to,
      cc: input.cc,
      bcc: input.bcc,
      subject: input.subject,
      html: input.html,
      text: input.text
    });
    return {
      providerMessageId: result.messageId,
      accepted: result.accepted.map(String),
      rejected: result.rejected.map(String)
    };
  }
};
var smtpMailProvider = new SmtpMailProvider();

// src/services/email/providers/zeptomail.provider.ts
var DEFAULT_ZEPTO_BASE_URL = "https://api.zeptomail.com/v1.1/email";
var ZeptoMailProvider = class {
  async send(input) {
    if (!env.ZEPTO_API_KEY) {
      throw new Error("ZeptoMail provider selected but ZEPTO_API_KEY is missing");
    }
    const url = env.ZEPTO_BASE_URL || DEFAULT_ZEPTO_BASE_URL;
    const payload = {
      from: {
        address: input.fromEmail,
        name: input.fromName || env.EMAIL_FROM_NAME || "LLF"
      },
      to: [{ email_address: { address: input.to } }],
      cc: (input.cc || []).map((email2) => ({ email_address: { address: email2 } })),
      bcc: (input.bcc || []).map((email2) => ({ email_address: { address: email2 } })),
      subject: input.subject,
      htmlbody: input.html,
      textbody: input.text
    };
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Zoho-enczapikey ${env.ZEPTO_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(`ZeptoMail send failed (${response.status}): ${responseBody}`);
    }
    const responseJson = await response.json();
    return {
      providerMessageId: responseJson.request_id,
      accepted: responseJson.data?.map((item) => item.email || "").filter(Boolean),
      rejected: []
    };
  }
};
var zeptoMailProvider = new ZeptoMailProvider();

// src/services/email/providers/mail.provider.ts
function resolveMailProvider(provider) {
  const selected = provider || env.EMAIL_PROVIDER || "smtp";
  if (selected === "zeptomail") {
    return zeptoMailProvider;
  }
  if (selected === "mock") {
    return mockMailProvider;
  }
  return smtpMailProvider;
}

// src/services/email/email.service.ts
var EmailService = class {
  async send(input) {
    const { template, to, data, ...options } = input;
    const rendered = await renderEmail(template, data);
    const provider = resolveMailProvider(options?.provider);
    if (!env.EMAIL_FROM_EMAIL) {
      throw new Error("EMAIL_FROM_EMAIL is not configured");
    }
    const save = await provider.send({
      to,
      cc: options?.cc,
      bcc: options?.bcc,
      fromEmail: env.EMAIL_FROM_EMAIL,
      fromName: env.EMAIL_FROM_NAME || void 0,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text
    });
    console.log("Email sent:", save);
    return save;
  }
  async sendNow(input) {
    return this.send(input);
  }
};
var emailService = new EmailService();

// src/workers/handlers/sendEmail.ts
var sendEmailHandler = async (job) => {
  const { type, payload, appId } = job.data;
  const emailPayload = payload;
  const parsed = emailTaskPayloadSchema.safeParse(emailPayload);
  if (!parsed.success) {
    throw new Error(`Invalid send_email payload: ${parsed.error.message}`);
  }
  console.info("[queue-worker] send_email", {
    type,
    appId,
    to: emailPayload.to,
    template: emailPayload.template,
    jobId: job.id
  });
  await emailService.send({
    to: emailPayload.to,
    template: emailPayload.template,
    data: emailPayload.data,
    cc: emailPayload.cc,
    bcc: emailPayload.bcc,
    provider: emailPayload.provider,
    metadata: emailPayload.metadata
  });
};

// src/workers/handlers/updateStats.ts
var updateStatsHandler = async (job) => {
  const { type, payload, appId } = job.data;
  const parsed = updateStatsPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(`Invalid update_stats payload: ${parsed.error.message}`);
  }
  console.info("[queue-worker] update_stats", {
    type,
    payload: parsed.data,
    appId,
    jobId: job.id
  });
};

// src/workers/handlers/index.ts
var workerHandlers = {
  send_email: sendEmailHandler,
  update_stats: updateStatsHandler,
  call_external_api: callExternalApiHandler
};

// src/workers/telemetry/queueTelemetry.ts
var import_pg = require("pg");
function getSink() {
  const raw = (process.env.QUEUE_LOG_SINK || "database").toLowerCase();
  if (raw === "database" || raw === "mixpanel" || raw === "both" || raw === "none") {
    return raw;
  }
  return "database";
}
function shouldLogToDatabase(sink) {
  return sink === "database" || sink === "both";
}
function shouldLogToMixpanel(sink) {
  return sink === "mixpanel" || sink === "both";
}
function getDatabaseUrl() {
  return process.env.DIRECT_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || null;
}
var QueueTelemetry = class {
  sink;
  mixpanelToken;
  pool;
  dbReady = false;
  constructor() {
    this.sink = getSink();
    this.mixpanelToken = process.env.MIXPANEL_TOKEN || null;
    const databaseUrl = getDatabaseUrl();
    this.pool = databaseUrl ? new import_pg.Pool({ connectionString: databaseUrl }) : null;
  }
  async ensureDbReady() {
    if (this.dbReady || !this.pool) {
      return;
    }
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS queue_worker_logs (
        id BIGSERIAL PRIMARY KEY,
        event_name TEXT NOT NULL,
        queue_name TEXT NOT NULL,
        status TEXT NOT NULL,
        job_id TEXT,
        job_type TEXT,
        app_id TEXT,
        payload JSONB,
        error TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    this.dbReady = true;
  }
  async writeDatabase(record) {
    if (!this.pool) {
      return;
    }
    await this.ensureDbReady();
    const eventName = `${record.queueName}:${record.status}`;
    await this.pool.query(
      `
        INSERT INTO queue_worker_logs (
          event_name,
          queue_name,
          status,
          job_id,
          job_type,
          app_id,
          payload,
          error,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9::jsonb)
      `,
      [
        eventName,
        record.queueName,
        record.status,
        record.jobId ?? null,
        record.jobType ?? null,
        record.appId ?? null,
        record.payload ? JSON.stringify(record.payload) : null,
        record.error ?? null,
        record.metadata ? JSON.stringify(record.metadata) : null
      ]
    );
  }
  async writeMixpanel(record) {
    if (!this.mixpanelToken) {
      return;
    }
    const eventName = `${record.queueName}:${record.status}`;
    const body = {
      event: eventName,
      properties: {
        token: this.mixpanelToken,
        distinct_id: record.jobId || record.appId || "queue-worker",
        queue_name: record.queueName,
        status: record.status,
        job_id: record.jobId,
        job_type: record.jobType,
        app_id: record.appId,
        payload: record.payload,
        error: record.error,
        metadata: record.metadata,
        source: "llf-worker",
        ts: (/* @__PURE__ */ new Date()).toISOString()
      }
    };
    await fetch("https://api.mixpanel.com/track?verbose=0", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }
  async track(record) {
    if (this.sink === "none") {
      return;
    }
    const tasks = [];
    if (shouldLogToDatabase(this.sink)) {
      tasks.push(this.writeDatabase(record));
    }
    if (shouldLogToMixpanel(this.sink)) {
      tasks.push(this.writeMixpanel(record));
    }
    const results = await Promise.allSettled(tasks);
    for (const result of results) {
      if (result.status === "rejected") {
        console.error("[queue-worker] telemetry write failed", {
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        });
      }
    }
  }
  async close() {
    if (!this.pool) {
      return;
    }
    await this.pool.end();
  }
};
var queueTelemetry = new QueueTelemetry();

// src/workers/worker.ts
var queueName = getQueueName();
var concurrency = getWorkerConcurrency();
var connection = createRedisConnection();
async function processJob(job) {
  const type = String(job.data.type);
  void queueTelemetry.track({
    queueName,
    status: "PROCESSING",
    jobId: String(job.id || ""),
    jobType: type,
    appId: job.data.appId,
    payload: job.data.payload,
    metadata: {
      attemptsMade: job.attemptsMade,
      timestamp: Date.now()
    }
  });
  if (!(type in workerHandlers)) {
    throw new Error(`No handler registered for queue task type: ${type}`);
  }
  switch (type) {
    case "send_email":
      await workerHandlers.send_email(job);
      return;
    case "update_stats":
      await workerHandlers.update_stats(job);
      return;
    case "call_external_api":
      await workerHandlers.call_external_api(
        job
      );
      return;
    default:
      throw new Error(`Unsupported queue task type: ${type}`);
  }
}
var worker = new import_bullmq.Worker(queueName, processJob, {
  connection,
  concurrency
});
worker.on("completed", (job) => {
  if (!job) {
    return;
  }
  void queueTelemetry.track({
    queueName,
    status: "COMPLETED",
    jobId: String(job.id || ""),
    jobType: job.name,
    appId: job.data.appId,
    metadata: {
      attemptsMade: job.attemptsMade,
      finishedOn: job.finishedOn
    }
  });
  console.info("[queue-worker] job completed", { type: job.name, jobId: job.id });
});
worker.on("failed", (job, error) => {
  void queueTelemetry.track({
    queueName,
    status: "FAILED",
    jobId: String(job?.id || ""),
    jobType: job?.name,
    appId: job?.data.appId,
    payload: job?.data.payload,
    error: error.message,
    metadata: {
      attemptsMade: job?.attemptsMade,
      failedReason: job?.failedReason
    }
  });
  console.error("[queue-worker] job failed", {
    type: job?.name,
    jobId: job?.id,
    error: error.message
  });
});
worker.on("error", (error) => {
  void queueTelemetry.track({
    queueName,
    status: "ERROR",
    error: error.message,
    metadata: {
      timestamp: Date.now()
    }
  });
  console.error("[queue-worker] worker error", { error: error.message });
});
void queueTelemetry.track({
  queueName,
  status: "STARTED",
  metadata: {
    concurrency,
    timestamp: Date.now()
  }
});
console.info("[queue-worker] started", { queueName, concurrency });
var shutdown = async (signal) => {
  await queueTelemetry.track({
    queueName,
    status: "SHUTDOWN",
    metadata: {
      signal,
      timestamp: Date.now()
    }
  });
  console.info("[queue-worker] shutting down", { signal });
  await worker.close();
  await connection.quit();
  await queueTelemetry.close();
  process.exit(0);
};
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
var app = (0, import_express.default)();
var port = process.env.PORT || 4e3;
app.get("/", (_, res) => {
  res.send("Hello World!");
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
