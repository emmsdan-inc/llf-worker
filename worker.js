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
    backgroundColor: "#0f172a"
    // Solid dark navy/black for authority
  },
  header: {
    padding: "40px 40px 24px",
    textAlign: "left"
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "-0.01em",
    lineHeight: 1.2
  },
  content: {
    padding: "0 40px 48px",
    lineHeight: 1.6,
    fontSize: "15px",
    color: "#334155"
  },
  footer: {
    padding: "32px 40px",
    backgroundColor: "#f1f5f9",
    color: "#64748b",
    fontSize: "12px",
    borderTop: "1px solid #e2e8f0"
  },
  platformName: {
    color: "#0f172a",
    fontWeight: 600,
    fontSize: "13px",
    marginBottom: "4px",
    display: "block"
  }
};
function EmailLayout({ title, previewText, children }) {
  return /* @__PURE__ */ React.createElement("html", { lang: "en" }, /* @__PURE__ */ React.createElement("head", null, /* @__PURE__ */ React.createElement("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }), /* @__PURE__ */ React.createElement("meta", { httpEquiv: "Content-Type", content: "text/html; charset=UTF-8" }), previewText && /* @__PURE__ */ React.createElement("div", { style: { display: "none", maxHeight: 0, overflow: "hidden" } }, previewText), /* @__PURE__ */ React.createElement("title", null, title)), /* @__PURE__ */ React.createElement("body", { style: styles.body }, /* @__PURE__ */ React.createElement("table", { role: "presentation", cellPadding: 0, cellSpacing: 0, width: "100%" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { align: "center" }, /* @__PURE__ */ React.createElement("table", { role: "presentation", style: styles.wrapper, width: "100%" }, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: styles.topAccent })), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: styles.header }, /* @__PURE__ */ React.createElement("h1", { style: styles.title }, title))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: styles.content }, /* @__PURE__ */ React.createElement("div", { style: { color: "#334155" } }, children))), /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { style: styles.footer }, /* @__PURE__ */ React.createElement("span", { style: styles.platformName }, "GODDAN SCHOOL OF MATHMATICS PLATFORM"), /* @__PURE__ */ React.createElement("p", { style: { margin: 0, lineHeight: 1.5 } }, "This communication contains important account or course information. Please do not reply directly to this automated message.")))))))));
}

// src/services/email/templates/assignment-graded.tsx
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
  return /* @__PURE__ */ React.createElement(
    EmailLayout,
    {
      title: "Daily Exercise Graded",
      previewText: `${subjectLabel} submission for "${assignmentTitle}" has been graded.`
    },
    /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","),
    /* @__PURE__ */ React.createElement("p", null, studentName ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("strong", null, studentName), "'s daily exercise submission for ", /* @__PURE__ */ React.createElement("strong", null, assignmentTitle), " has been graded.") : /* @__PURE__ */ React.createElement(React.Fragment, null, "Your daily exercise submission for ", /* @__PURE__ */ React.createElement("strong", null, assignmentTitle), " has been graded.")),
    /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Class:"), " ", className), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Score:"), " ", score), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Percentage:"), " ", scorePercentage), passedLabel ? /* @__PURE__ */ React.createElement("li", { style: { color: passedColor } }, /* @__PURE__ */ React.createElement("strong", null, "Result:"), " ", passedLabel) : null),
    feedback ? /* @__PURE__ */ React.createElement("div", { style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "12px 16px", marginTop: "16px" } }, /* @__PURE__ */ React.createElement("strong", null, "Tutor Feedback:"), /* @__PURE__ */ React.createElement("p", { style: { marginTop: "8px", marginBottom: 0 } }, feedback)) : null,
    actionUrl ? /* @__PURE__ */ React.createElement("p", { style: { marginTop: "16px" } }, /* @__PURE__ */ React.createElement("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 } }, "View full results")) : null
  );
}

// src/services/email/templates/assignment-reminder.tsx
function AssignmentReminderTemplate({ recipientName, studentName, assignmentTitle, className, dueDate, actionUrl }) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Daily Exercise Reminder", previewText: "A new daily exercise is available." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, studentName ? `${studentName} has a new daily exercise.` : "A new daily exercise has been created."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Daily Exercise: ", assignmentTitle), /* @__PURE__ */ React.createElement("li", null, "Class: ", className), dueDate ? /* @__PURE__ */ React.createElement("li", null, "Due Date: ", dueDate) : null), actionUrl ? /* @__PURE__ */ React.createElement("p", null, "Open daily exercise: ", /* @__PURE__ */ React.createElement("a", { href: actionUrl }, actionUrl)) : null);
}

// src/services/email/templates/assignment-submitted.tsx
function AssignmentSubmittedTemplate({
  recipientName,
  studentName,
  assignmentTitle,
  className,
  submittedAt,
  isLate,
  actionUrl
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Daily Exercise Submitted", previewText: `${studentName} has submitted "${assignmentTitle}".` }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("strong", null, studentName), " has submitted a daily exercise and is awaiting your review."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Daily Exercise:"), " ", assignmentTitle), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Class:"), " ", className), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Submitted At:"), " ", submittedAt), isLate ? /* @__PURE__ */ React.createElement("li", { style: { color: "#dc2626" } }, /* @__PURE__ */ React.createElement("strong", null, "Note:"), " This submission was late.") : null), actionUrl ? /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 } }, "Review submission")) : null);
}

// src/services/email/templates/billing-reminder.tsx
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
  return /* @__PURE__ */ React.createElement(
    EmailLayout,
    {
      title: isFinal ? "Final Payment Reminder" : "Payment Reminder",
      previewText: isFinal ? "Your class access will be locked if payment is not received." : "Your monthly subscription payment is due today."
    },
    /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","),
    /* @__PURE__ */ React.createElement("p", null, isFinal ? "This is your final reminder before class access is locked for unpaid billing." : "Your monthly subscription payment is due today."),
    /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Student: ", studentName), /* @__PURE__ */ React.createElement("li", null, "Class: ", className), /* @__PURE__ */ React.createElement("li", null, "Amount Due: ", amount), /* @__PURE__ */ React.createElement("li", null, "Due Date: ", dueDate), /* @__PURE__ */ React.createElement("li", null, "Grace Ends: ", graceEndsAt)),
    /* @__PURE__ */ React.createElement("p", null, isFinal ? "Please make sure payment is completed before the grace period ends to avoid loss of access to live class links." : "If the automatic debit does not go through today, the 5-day grace window stays open until the date above."),
    /* @__PURE__ */ React.createElement("p", null, "Thank you for choosing Goddan.")
  );
}

// src/services/email/templates/class-attendance-alert.tsx
function ClassAttendanceAlertTemplate({
  recipientName,
  studentName,
  className,
  scheduledAt,
  alertType,
  meetingLink
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Attendance Alert", previewText: "A student is late and attendance is still missing." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, alertType === "late-no-attendance" ? `${studentName} is now 10 minutes late for class and attendance has not been marked as present.` : `${studentName} has an attendance alert.`), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Class: ", className), /* @__PURE__ */ React.createElement("li", null, "Scheduled time: ", scheduledAt)), meetingLink ? /* @__PURE__ */ React.createElement("p", null, "Join class now: ", /* @__PURE__ */ React.createElement("a", { href: meetingLink }, meetingLink)) : null, /* @__PURE__ */ React.createElement("p", null, "Please check in and join the class immediately if possible."));
}

// src/services/email/templates/child-profile-added.tsx
function ChildProfileAddedTemplate({
  parentName,
  childName,
  childEmail,
  relationship,
  createdAt
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Child Profile Added", previewText: "A new child profile was added to your parent account." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", parentName, ","), /* @__PURE__ */ React.createElement("p", null, "A new child profile was added to your account."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Child name: ", childName), childEmail ? /* @__PURE__ */ React.createElement("li", null, "Child email: ", childEmail) : null, relationship ? /* @__PURE__ */ React.createElement("li", null, "Relationship/Gender: ", relationship) : null, createdAt ? /* @__PURE__ */ React.createElement("li", null, "Created at: ", createdAt) : null), /* @__PURE__ */ React.createElement("p", null, "If you did not make this change, contact support immediately."));
}

// src/services/email/templates/class-enrollment.tsx
function ClassEnrollmentTemplate({
  recipientName,
  studentName,
  className,
  classVariantName,
  startDate,
  tutorName,
  note
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Class Enrollment Update", previewText: "A new enrollment has been recorded." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, "A new enrollment has been recorded."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Student: ", studentName), /* @__PURE__ */ React.createElement("li", null, "Class: ", className), classVariantName ? /* @__PURE__ */ React.createElement("li", null, "Variant: ", classVariantName) : null, startDate ? /* @__PURE__ */ React.createElement("li", null, "Start Date: ", startDate) : null, tutorName ? /* @__PURE__ */ React.createElement("li", null, "Tutor: ", tutorName) : null), note ? /* @__PURE__ */ React.createElement("p", null, note) : null);
}

// src/services/email/templates/class-reminder.tsx
function ClassReminderTemplate({ recipientName, className, startsAt, tutorName, meetingLink }) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Class Reminder", previewText: "Your class starts soon." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, "This is a reminder for your upcoming class."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Class: ", className), /* @__PURE__ */ React.createElement("li", null, "Starts: ", startsAt), tutorName ? /* @__PURE__ */ React.createElement("li", null, "Tutor: ", tutorName) : null), meetingLink ? /* @__PURE__ */ React.createElement("p", null, "Join link: ", /* @__PURE__ */ React.createElement("a", { href: meetingLink }, meetingLink)) : null);
}

// src/services/email/templates/enrollment-confirmation.tsx
function EnrollmentConfirmationTemplate({
  parentName,
  studentName,
  className,
  classVariantName,
  startDate,
  tutorName,
  actionUrl
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Enrollment Confirmed", previewText: `${studentName} is now enrolled in ${className}.` }, /* @__PURE__ */ React.createElement("p", null, "Hi ", parentName, ","), /* @__PURE__ */ React.createElement("p", null, "Great news! ", /* @__PURE__ */ React.createElement("strong", null, studentName), " has been successfully enrolled in the following class:"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Class:"), " ", className), classVariantName ? /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Schedule:"), " ", classVariantName) : null, startDate ? /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Start Date:"), " ", startDate) : null, tutorName ? /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("strong", null, "Tutor:"), " ", tutorName) : null), /* @__PURE__ */ React.createElement("p", null, "We look forward to seeing ", studentName, " in class. If you have any questions, feel free to reach out."), actionUrl ? /* @__PURE__ */ React.createElement("p", null, /* @__PURE__ */ React.createElement("a", { href: actionUrl, style: { color: "#4f46e5", fontWeight: 600 } }, "View class details")) : null);
}

// src/services/email/templates/password-changed.tsx
function PasswordChangedTemplate({ recipientName, changedAt, supportEmail }) {
  return /* @__PURE__ */ React.createElement(
    EmailLayout,
    {
      title: "Password Updated",
      previewText: "This confirms your account password was changed."
    },
    /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","),
    /* @__PURE__ */ React.createElement("p", null, "Your account password was changed successfully on ", changedAt, "."),
    /* @__PURE__ */ React.createElement("p", null, "If you made this change, no further action is needed."),
    /* @__PURE__ */ React.createElement("p", null, "If you did not make this change, please reset your password immediately and contact support", supportEmail ? ` at ${supportEmail}` : "", ".")
  );
}

// src/services/email/templates/password-reset.tsx
function PasswordResetTemplate({ recipientName, resetUrl, expiresInMinutes = 30 }) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Password Reset", previewText: "Reset your password securely." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, "We received a request to reset your password."), /* @__PURE__ */ React.createElement("p", null, "Reset link: ", /* @__PURE__ */ React.createElement("a", { href: resetUrl }, resetUrl)), /* @__PURE__ */ React.createElement("p", null, "This link expires in ", expiresInMinutes, " minutes."));
}

// src/services/email/templates/payment-receipt.tsx
function PaymentReceiptTemplate({
  parentName,
  childName,
  className,
  amount,
  currency = "NGN",
  paidAt,
  receiptRef
}) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Payment Receipt", previewText: "Your payment was successful." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", parentName, ","), /* @__PURE__ */ React.createElement("p", null, "We\u2019ve received your payment successfully."), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "Student: ", childName), /* @__PURE__ */ React.createElement("li", null, "Class: ", className), /* @__PURE__ */ React.createElement("li", null, "Amount: ", amount, " ", currency), receiptRef ? /* @__PURE__ */ React.createElement("li", null, "Reference: ", receiptRef) : null, paidAt ? /* @__PURE__ */ React.createElement("li", null, "Paid At: ", paidAt) : null), /* @__PURE__ */ React.createElement("p", null, "Thank you for choosing Goddan."));
}

// src/services/email/templates/tutor-admin-update.tsx
function TutorAdminUpdateTemplate({
  tutorName,
  loginEmail,
  temporaryPassword,
  action,
  changes
}) {
  const title = action === "created" ? "Tutor Account Created" : action === "verification-updated" ? "Tutor Verification Updated" : "Tutor Profile Updated";
  const previewText = action === "created" ? "Your tutor account has been created by an admin." : action === "verification-updated" ? "Your verification status has been updated by an admin." : "Your tutor profile has been updated by an admin.";
  return /* @__PURE__ */ React.createElement(EmailLayout, { title, previewText }, /* @__PURE__ */ React.createElement("p", null, "Hi ", tutorName, ","), /* @__PURE__ */ React.createElement("p", null, "An administrator just ", action === "created" ? "created" : "updated", " your tutor account."), /* @__PURE__ */ React.createElement("p", null, "Login email: ", /* @__PURE__ */ React.createElement("strong", null, loginEmail)), temporaryPassword ? /* @__PURE__ */ React.createElement("p", null, "Temporary password: ", /* @__PURE__ */ React.createElement("strong", null, temporaryPassword)) : null, changes.length > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("p", null, "Changes made:"), /* @__PURE__ */ React.createElement("ul", null, changes.map((change) => /* @__PURE__ */ React.createElement("li", { key: change }, change)))) : null, /* @__PURE__ */ React.createElement("p", null, "If you did not expect this update, please contact support immediately."));
}

// src/services/email/templates/weekly-report.tsx
function WeeklyReportTemplate({ recipientName, weekLabel, summaryItems, actionUrl }) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Weekly Progress Report", previewText: "Your weekly report is ready." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", recipientName, ","), /* @__PURE__ */ React.createElement("p", null, "Here is your summary for ", weekLabel, ":"), /* @__PURE__ */ React.createElement("ul", null, summaryItems.map((item) => /* @__PURE__ */ React.createElement("li", { key: item }, item))), actionUrl ? /* @__PURE__ */ React.createElement("p", null, "View details: ", /* @__PURE__ */ React.createElement("a", { href: actionUrl }, actionUrl)) : null);
}

// src/services/email/templates/welcome.tsx
function WelcomeTemplate({ name, role = "parent", dashboardUrl }) {
  return /* @__PURE__ */ React.createElement(EmailLayout, { title: "Welcome to Goddan", previewText: "Your account has been created successfully." }, /* @__PURE__ */ React.createElement("p", null, "Hi ", name, ","), /* @__PURE__ */ React.createElement("p", null, "Welcome to Goddan. Your ", role, " account is now active."), dashboardUrl ? /* @__PURE__ */ React.createElement("p", null, "Get started here: ", /* @__PURE__ */ React.createElement("a", { href: dashboardUrl }, dashboardUrl)) : null, /* @__PURE__ */ React.createElement("p", null, "We\u2019re glad to have you onboard."));
}

// src/services/email/registry/template.registry.ts
var templateRegistry = {
  welcome: {
    subject: () => "Welcome to Goddan",
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
  VERCEL_TOKEN: z2.string().trim().optional(),
  VERCEL_ORG_ID: z2.string().trim().optional(),
  VERCEL_PROJECT_ID: z2.string().trim().optional(),
  ZEPTO_API_KEY: z2.string().trim().optional(),
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
        name: input.fromName || env.EMAIL_FROM_NAME || "Goddan"
      },
      to: [{ email_address: { address: input.to } }],
      cc: (input.cc || []).map((email) => ({ email_address: { address: email } })),
      bcc: (input.bcc || []).map((email) => ({ email_address: { address: email } })),
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
    return save;
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
