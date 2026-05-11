#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  buildTeacherPacket,
  compactTeacherPacket,
  evidenceAuditMarkdown,
  evidenceAuditSummaryMarkdown,
  explainModification,
  learnerProfileSummaryMarkdown,
  learnerProfileSummary,
  lessonMapSummaryMarkdown,
  lessonMapSummary,
  lessonMapMarkdown,
  reviewPacketQuality,
  studentProfileMarkdown,
  teacherPacketBriefMarkdown,
  teacherHandoutMarkdown
} from "./generator.js";
import { evidenceById, learnerProfile, lessonChunks } from "./knowledge.js";
import { EvidenceRefSchema } from "./schemas.js";

const server = new McpServer({
  name: "waypoint-differentiation-lab",
  version: "1.0.0"
});

const LessonMapChunkOutputSchema = z.object({
  id: z.string(),
  phase: z.string(),
  title: z.string(),
  minutes: z.number(),
  evidenceIds: z.array(z.string()).optional()
}).passthrough();
const LessonMapOutputSchema = z.object({
  chunks: z.array(LessonMapChunkOutputSchema)
}).passthrough();
const LearnerProfileOutputSchema = z.object({
  caseLabel: z.literal("Learner 7A"),
  grade: z.string(),
  supportIds: z.array(z.string()).optional(),
  evidence: z.array(z.object({ id: z.string(), source: z.string() }).passthrough()).optional()
}).passthrough();
const ModificationOutputSchema = z.object({
  id: z.string(),
  lessonMoment: z.string(),
  teacherAction: z.string(),
  standardPreserved: z.literal("RI.7.2").optional(),
  evidenceRefs: z.array(z.string()).optional(),
  receiptTool: z.literal("explain_modification").optional()
}).passthrough();
const TeacherPacketToolOutputSchema = z.object({
  title: z.string(),
  caseLabel: z.literal("Learner 7A"),
  teacherMode: z.literal("Tomorrow Mode"),
  preservedStandard: z.literal("RI.7.2"),
  useFirst: z.array(z.string()),
  modifications: z.array(ModificationOutputSchema),
  detail: z.literal("compact").optional(),
  materialIds: z.array(z.string()).optional(),
  quality: z
    .object({
      passed: z.boolean(),
      summary: z.string()
    })
    .optional(),
  nextTools: z.array(z.string()).optional(),
  qualityReport: z.object({ passed: z.boolean(), summary: z.string() }).passthrough().optional()
}).passthrough();
const ModificationExplanationOutputSchema = z.object({
  modification: ModificationOutputSchema,
  evidenceTrace: z.object({
    modificationId: z.string(),
    standardPreserved: z.literal("RI.7.2")
  }).passthrough(),
  receipts: z.object({
    preservedStandard: z.literal("RI.7.2")
  }).passthrough()
}).passthrough();
const QualityReportOutputSchema = z.object({
  passed: z.boolean(),
  summary: z.string(),
  flags: z.array(z.object({ kind: z.string(), modificationId: z.string().optional() }).passthrough()).optional()
}).passthrough();
const EvidenceAuditOutputSchema = z.object({
  detail: z.enum(["summary", "full"]),
  markdown: z.string(),
  modificationIds: z.array(z.string()),
  nextTool: z.string().optional()
});

function textContent(text: string) {
  return [{ type: "text" as const, text }];
}

function learnerProfileToolText(profile: ReturnType<typeof learnerProfileSummary> | typeof learnerProfile, detail: "summary" | "full") {
  const evidenceIds = "supportIds" in profile ? profile.supportIds : profile.evidence.map((entry) => entry.id);
  return [
    `${profile.caseLabel}, grade ${profile.grade}: attention, initiation, stamina, and informational-text comprehension are the planning barriers.`,
    `Use strengths: peer talk, helping roles, specific praise. Evidence refs: ${evidenceIds.join(", ")}.`,
    `Returned ${detail} structuredContent; call detail:"full" only when you need goals, accommodations, and quotes.`
  ].join("\n");
}

function lessonMapToolText(
  chunks: Array<{ id: string; phase: string; minutes: number }>,
  includeEvidence: boolean
) {
  const chunkList = chunks.map((chunk) => `${chunk.id} (${chunk.phase}, ${chunk.minutes}m)`).join("; ");
  const evidenceMode = includeEvidence ? "quote text included" : "evidence IDs only";
  return [
    `${chunks.length} lesson chunks returned, ${evidenceMode}.`,
    chunkList,
    "Structured content carries teacher moves, student tasks, and evidence refs."
  ].join("\n");
}

function shortText(text: string, max = 150) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function modificationReceiptText(explanation: ReturnType<typeof explainModification>) {
  const trace = explanation.evidenceTrace;
  return [
    `Receipt for ${trace.modificationId}: ${explanation.modification.supportType} support, preserves ${trace.standardPreserved}.`,
    `IEP (${trace.iep.id}): ${shortText(trace.iepQuote)}`,
    `Lesson (${trace.lesson.id}): ${shortText(trace.lessonDemand)}`,
    `UDL: ${trace.udlAlignment.map((item) => item.principle).join(", ")}.`,
    `Progress check: ${shortText(trace.progressCheck, 180)}`,
    "Full modification and quote trace are in structuredContent."
  ].join("\n");
}

function qualityReportText(report: ReturnType<typeof reviewPacketQuality>) {
  const status = report.passed ? "passed" : "needs review";
  const flags = report.flags.length
    ? report.flags.map((flag) => `${flag.kind}:${flag.modificationId}`).join(", ")
    : "none";
  return [
    `${report.name}: ${status}.`,
    report.summary,
    `Flags: ${flags}. Structured content includes all check booleans and flag messages.`
  ].join("\n");
}

server.registerResource(
  "learner-profile-summary",
  "waypoint://case/learner-7a/summary",
  {
    title: "Learner 7A planning summary",
    description: "Compact planning gist for starting a client workflow without reading the full profile.",
    mimeType: "text/markdown"
  },
  async () => ({
    contents: [{ uri: "waypoint://case/learner-7a/summary", text: learnerProfileSummaryMarkdown() }]
  })
);

server.registerResource(
  "learner-profile",
  "waypoint://case/learner-7a/profile",
  {
    title: "Learner 7A planning profile",
    description: "Pseudonymized learner profile organized around classroom decision-making.",
    mimeType: "text/markdown"
  },
  async () => ({
    contents: [{ uri: "waypoint://case/learner-7a/profile", text: studentProfileMarkdown() }]
  })
);

server.registerResource(
  "community-lesson-summary",
  "waypoint://lesson/community/summary",
  {
    title: "Community lesson summary",
    description: "Compact chunk index for starting a client workflow without reading the full lesson map.",
    mimeType: "text/markdown"
  },
  async () => ({
    contents: [{ uri: "waypoint://lesson/community/summary", text: lessonMapSummaryMarkdown() }]
  })
);

server.registerResource(
  "community-lesson-map",
  "waypoint://lesson/community/map",
  {
    title: "Community lesson map",
    description: "Instructional phases and evidence from the sample lesson.",
    mimeType: "text/markdown"
  },
  async () => ({
    contents: [{ uri: "waypoint://lesson/community/map", text: lessonMapMarkdown() }]
  })
);

server.registerResource(
  "sample-teacher-packet",
  "waypoint://packet/community/learner-7a",
  {
    title: "Sample Tomorrow Mode packet",
    description: "A teacher-ready packet generated from the lesson and learner profile.",
    mimeType: "application/json"
  },
  async () => ({
    contents: [
      {
        uri: "waypoint://packet/community/learner-7a",
        text: JSON.stringify(compactTeacherPacket(buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" })), null, 2)
      }
    ]
  })
);

server.registerResource(
  "teacher-handout",
  "waypoint://packet/community/learner-7a/handout",
  {
    title: "Teacher handout markdown",
    description: "Tomorrow Mode handout rendered from the same deterministic packet.",
    mimeType: "text/markdown"
  },
  async () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    return {
      contents: [{ uri: "waypoint://packet/community/learner-7a/handout", text: teacherHandoutMarkdown(packet) }]
    };
  }
);

server.registerTool(
  "get_learner_profile",
  {
    title: "Get learner profile",
    description:
      "Return the pseudonymized learner profile. Defaults to a compact summary; request full only when writing a complete handout.",
    inputSchema: {
      detail: z.enum(["summary", "full"]).default("summary")
    },
    outputSchema: LearnerProfileOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ detail }) => {
    const profile = detail === "full" ? learnerProfile : learnerProfileSummary();
    return {
      content: textContent(learnerProfileToolText(profile, detail)),
      structuredContent: profile
    };
  }
);

server.registerTool(
  "get_lesson_map",
  {
    title: "Get lesson map",
    description: "Return the lesson as teacher-actionable chunks rather than one raw PDF dump.",
    inputSchema: {
      phase: z
        .enum(["overview", "before-reading", "during-reading", "independent-practice", "discussion", "all"])
        .default("all")
        .describe("Optional lesson phase filter."),
      includeEvidence: z.boolean().default(false).describe("Include quote text. Defaults false to keep MCP payloads light.")
    },
    outputSchema: LessonMapOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ phase, includeEvidence }) => {
    const sourceChunks = includeEvidence ? lessonChunks : lessonMapSummary();
    const chunks = phase === "all" ? sourceChunks : sourceChunks.filter((chunk) => chunk.phase === phase);
    return {
      content: textContent(lessonMapToolText(chunks, includeEvidence)),
      structuredContent: { chunks }
    };
  }
);

server.registerTool(
  "generate_teacher_packet",
  {
    title: "Generate Tomorrow Mode packet",
    description:
      "Generate concrete lesson modifications for Learner 7A. The output is deterministic and evidence-grounded so a teacher or MCP client can inspect the receipts.",
    inputSchema: {
      minutesAvailable: z
        .union([z.literal(5), z.literal(15), z.literal(45)])
        .default(45)
        .describe("How much prep time the teacher has."),
      emphasis: z
        .enum(["minimum-viable", "balanced", "full-support"])
        .default("balanced")
        .describe("How much support to include."),
      detail: z
        .enum(["compact", "full"])
        .default("compact")
        .describe("Compact returns IDs and short actions. Full returns the handout and quote-level traces.")
    },
    outputSchema: TeacherPacketToolOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis, detail }) => {
    const packet = buildTeacherPacket({ minutesAvailable, emphasis });
    if (detail === "compact") {
      const compact = compactTeacherPacket(packet);
      return {
        content: [{ type: "text", text: teacherPacketBriefMarkdown(packet) }],
        structuredContent: compact
      };
    }
    return {
      content: [{ type: "text", text: teacherHandoutMarkdown(packet) }],
      structuredContent: packet
    };
  }
);

server.registerTool(
  "explain_modification",
  {
    title: "Explain a modification",
    description:
      "Return the Receipts Rail trace for a recommendation: source quote, lesson demand, UDL alignment, preserved standard, and progress check.",
    inputSchema: {
      modificationId: z.string().describe("Modification ID, such as mod-annotation-code.")
    },
    outputSchema: ModificationExplanationOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ modificationId }) => {
    try {
      const explanation = explainModification(modificationId);
      return {
        content: textContent(modificationReceiptText(explanation)),
        structuredContent: explanation
      };
    } catch (error) {
      return {
        isError: true,
        content: textContent(error instanceof Error ? error.message : "Unknown modification error")
      };
    }
  }
);

server.registerTool(
  "review_packet_quality",
  {
    title: "Review packet quality",
    description:
      "Run the No Hand-Wavy Accommodations Detector against a generated packet and flag vague, unsupported, unsafe, or lowered-rigor recommendations.",
    inputSchema: {
      minutesAvailable: z
        .union([z.literal(5), z.literal(15), z.literal(45)])
        .default(45)
        .describe("How much prep time the generated packet should assume."),
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("balanced")
    },
    outputSchema: QualityReportOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis }) => {
    const packet = buildTeacherPacket({ minutesAvailable, emphasis });
    const report = reviewPacketQuality(packet);
    return {
      content: textContent(qualityReportText(report)),
      structuredContent: report
    };
  }
);

server.registerTool(
  "explain_evidence",
  {
    title: "Look up evidence",
    description: "Look up an evidence ID used in a modification.",
    inputSchema: {
      id: z.string().describe("Evidence ID, such as iep-ela-goal or lesson-short-response.")
    },
    outputSchema: EvidenceRefSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ id }) => {
    const evidence = evidenceById(id);
    if (!evidence) {
      return {
        isError: true,
        content: textContent(`No evidence found for id: ${id}`)
      };
    }
    return {
      content: textContent(`${evidence.id} (${evidence.source}): ${evidence.quote}`),
      structuredContent: evidence
    };
  }
);

server.registerTool(
  "render_evidence_audit",
  {
    title: "Render evidence audit",
    description: "Render a compact evidence audit by default; request full for quote-level reviewer markdown.",
    inputSchema: {
      minutesAvailable: z.union([z.literal(5), z.literal(15), z.literal(45)]).default(45),
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("full-support"),
      detail: z.enum(["summary", "full"]).default("summary")
    },
    outputSchema: EvidenceAuditOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis, detail }) => {
    const packet = buildTeacherPacket({ minutesAvailable, emphasis });
    const markdown = detail === "full" ? evidenceAuditMarkdown(packet) : evidenceAuditSummaryMarkdown(packet);
    return {
      content: textContent(markdown),
      structuredContent: {
        detail,
        markdown,
        modificationIds: packet.modifications.map((mod) => mod.id),
        nextTool: detail === "summary" ? "render_evidence_audit({ detail: 'full' })" : undefined
      }
    };
  }
);

server.registerPrompt(
  "differentiate_community_lesson",
  {
    description: "Prompt an MCP client to turn the resources and tools into a final teacher handout.",
    argsSchema: {
      teacherNeed: z
        .string()
        .default("I need tomorrow's 45-minute lesson modified for Learner 7A with minimal prep.")
        .describe("Teacher's situation or constraint.")
    }
  },
  async ({ teacherNeed }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: [
            teacherNeed,
            "",
            "Start with the learner-profile-summary and community-lesson-summary resources.",
            "Read the full learner-profile or community-lesson-map resources only when quote text changes the handout.",
            "Call generate_teacher_packet with detail compact first. Use explain_modification only for recommendations you actually include.",
            "Return a concise Tomorrow Mode handout with before class, during reading, independent practice, discussion, and exit-ticket sections.",
            "Every recommendation must cite evidence IDs. Pull quote text only when it changes the answer.",
            "Do not put adult-facing labels in student-facing language."
          ].join("\n")
        }
      }
    ]
  })
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("waypoint-differentiation-lab running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
