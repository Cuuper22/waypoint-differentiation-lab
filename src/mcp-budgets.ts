export const mcpTextBudgets = {
  generateTeacherPacketCompact: 1200,
  getLearnerProfileSummary: 520,
  getLessonMapSummary: 900,
  explainModificationReceipt: 850,
  reviewPacketQualitySummary: 480,
  explainEvidenceLookup: 320,
  renderEvidenceAuditSummary: 1100
} as const;

export const mcpTextBudgetRows = [
  {
    tool: "generate_teacher_packet",
    mode: "compact",
    budget: mcpTextBudgets.generateTeacherPacketCompact,
    textChannel: "brief handoff",
    structuredContent: "compact packet"
  },
  {
    tool: "get_learner_profile",
    mode: "summary",
    budget: mcpTextBudgets.getLearnerProfileSummary,
    textChannel: "planning gist",
    structuredContent: "profile object"
  },
  {
    tool: "get_lesson_map",
    mode: "summary",
    budget: mcpTextBudgets.getLessonMapSummary,
    textChannel: "phase list",
    structuredContent: "lesson chunks"
  },
  {
    tool: "explain_modification",
    mode: "receipt",
    budget: mcpTextBudgets.explainModificationReceipt,
    textChannel: "short receipt",
    structuredContent: "quote trace"
  },
  {
    tool: "review_packet_quality",
    mode: "summary",
    budget: mcpTextBudgets.reviewPacketQualitySummary,
    textChannel: "verdict",
    structuredContent: "check flags"
  },
  {
    tool: "explain_evidence",
    mode: "lookup",
    budget: mcpTextBudgets.explainEvidenceLookup,
    textChannel: "single receipt ref",
    structuredContent: "typed evidence"
  },
  {
    tool: "render_evidence_audit",
    mode: "summary",
    budget: mcpTextBudgets.renderEvidenceAuditSummary,
    textChannel: "ref index",
    structuredContent: "audit selector"
  }
] as const;
