export const mcpTextBudgets = {
  generateTeacherPacketCompact: 1200,
  getLearnerProfileSummary: 520,
  getLessonMapSummary: 900,
  explainModificationReceipt: 850,
  reviewPacketQualitySummary: 480,
  explainEvidenceLookup: 320,
  renderEvidenceAuditSummary: 1100
} as const;

export const mcpStructuredBudgets = {
  generateTeacherPacketCompact: 3200,
  explainModificationReceipt: 2600,
  renderEvidenceAuditSummary: 260
} as const;

export const mcpManifestBudgets = {
  toolCatalogMaxChars: 4500,
  toolManifestMaxChars: 900,
  outputSchemaMaxChars: 320,
  descriptionMaxChars: 65
} as const;

export const mcpPromptBudgets = {
  promptCatalogMaxChars: 500,
  promptManifestMaxChars: 450,
  promptMessageMaxChars: 850
} as const;

export const mcpResourceBudgets = {
  learnerProfileSummary: 900,
  lessonMapSummary: 1400
} as const;

export const mcpCatalogBudgetRow = {
  tool: "tool catalog",
  mode: "startup",
  budget: mcpManifestBudgets.toolCatalogMaxChars,
  textChannel: "concise tool list",
  structuredContent: "shallow passthrough schemas"
} as const;

export const mcpPromptBudgetRow = {
  prompt: "differentiate_community_lesson",
  mode: "prompt",
  catalogBudget: mcpPromptBudgets.promptCatalogMaxChars,
  messageBudget: mcpPromptBudgets.promptMessageMaxChars,
  textChannel: "compact orchestration route",
  structuredContent: "summary resources plus compact packet first"
} as const;

export const mcpResourceBudgetRows = [
  {
    tool: "learner-profile summary resource",
    mode: "resource",
    budget: mcpResourceBudgets.learnerProfileSummary,
    textChannel: "planning gist",
    structuredContent: "full profile resource"
  },
  {
    tool: "lesson-map summary resource",
    mode: "resource",
    budget: mcpResourceBudgets.lessonMapSummary,
    textChannel: "chunk index",
    structuredContent: "full lesson resource"
  }
] as const;

export const mcpTextBudgetRows = [
  {
    tool: "generate_teacher_packet",
    mode: "compact",
    budget: mcpTextBudgets.generateTeacherPacketCompact,
    textChannel: "brief handoff",
    structuredContent: `compact packet <= ${mcpStructuredBudgets.generateTeacherPacketCompact} chars`
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
    structuredContent: `slim quote trace <= ${mcpStructuredBudgets.explainModificationReceipt} chars`
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
    structuredContent: `audit selector <= ${mcpStructuredBudgets.renderEvidenceAuditSummary} chars`
  }
] as const;
