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

const server = new McpServer({
  name: "waypoint-differentiation-lab",
  version: "1.0.0"
});

const IdObjectSchema = z.object({ id: z.string() }).passthrough();
const LessonMapOutputSchema = z.object({ chunks: z.array(IdObjectSchema) }).passthrough();
const LearnerProfileOutputSchema = z.object({ caseLabel: z.string() }).passthrough();
const TeacherPacketToolOutputSchema = z.object({ modifications: z.array(IdObjectSchema) }).passthrough();
const ModificationExplanationOutputSchema = z.object({ modification: IdObjectSchema }).passthrough();
const QualityReportOutputSchema = z.object({ passed: z.boolean() }).passthrough();
const EvidenceLookupOutputSchema = z.object({ id: z.string(), source: z.enum(["IEP", "Lesson", "UDL"]) }).passthrough();
const EvidenceAuditOutputSchema = z.object({ detail: z.enum(["summary", "full"]) }).passthrough();
const PrepMinutesSchema = z.number().default(45);
const LessonPhaseSchema = z.string().default("all");

type PrepMinutes = 5 | 15 | 45;
type LessonPhase = "overview" | "before-reading" | "during-reading" | "independent-practice" | "discussion" | "all";

function textContent(text: string) {
  return [{ type: "text" as const, text }];
}

function toolError(error: unknown) {
  return {
    isError: true,
    content: textContent(error instanceof Error ? error.message : "Unknown tool error")
  };
}

function prepMinutes(value: number): PrepMinutes {
  if (value === 5 || value === 15 || value === 45) return value;
  throw new Error("minutesAvailable must be 5, 15, or 45.");
}

function lessonPhase(value: string): LessonPhase {
  if (
    value === "overview" ||
    value === "before-reading" ||
    value === "during-reading" ||
    value === "independent-practice" ||
    value === "discussion" ||
    value === "all"
  ) {
    return value;
  }
  throw new Error("phase must be overview, before-reading, during-reading, independent-practice, discussion, or all.");
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
    description: "Learner context; summary default, full adds quotes.",
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
    description: "Lesson chunks; evidence text optional.",
    inputSchema: {
      phase: LessonPhaseSchema,
      includeEvidence: z.boolean().default(false)
    },
    outputSchema: LessonMapOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ phase, includeEvidence }) => {
    try {
      const selectedPhase = lessonPhase(phase);
      const sourceChunks = includeEvidence ? lessonChunks : lessonMapSummary();
      const chunks =
        selectedPhase === "all" ? sourceChunks : sourceChunks.filter((chunk) => chunk.phase === selectedPhase);
      return {
        content: textContent(lessonMapToolText(chunks, includeEvidence)),
        structuredContent: { chunks }
      };
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "generate_teacher_packet",
  {
    title: "Generate Tomorrow Mode packet",
    description: "Generate supports; compact default, full adds handout.",
    inputSchema: {
      minutesAvailable: PrepMinutesSchema,
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("balanced"),
      detail: z.enum(["compact", "full"]).default("compact")
    },
    outputSchema: TeacherPacketToolOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis, detail }) => {
    try {
      const packet = buildTeacherPacket({ minutesAvailable: prepMinutes(minutesAvailable), emphasis });
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
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "explain_modification",
  {
    title: "Explain a modification",
    description: "One support receipt: quote, demand, UDL, check.",
    inputSchema: {
      modificationId: z.string()
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
    description: "Detector for vague, unsafe, or lowered-rigor advice.",
    inputSchema: {
      minutesAvailable: PrepMinutesSchema,
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("balanced")
    },
    outputSchema: QualityReportOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis }) => {
    try {
      const packet = buildTeacherPacket({ minutesAvailable: prepMinutes(minutesAvailable), emphasis });
      const report = reviewPacketQuality(packet);
      return {
        content: textContent(qualityReportText(report)),
        structuredContent: report
      };
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "explain_evidence",
  {
    title: "Look up evidence",
    description: "Look up one evidence ID.",
    inputSchema: {
      id: z.string()
    },
    outputSchema: EvidenceLookupOutputSchema,
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
    description: "Ref index by default; full adds quote table.",
    inputSchema: {
      minutesAvailable: PrepMinutesSchema,
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("full-support"),
      detail: z.enum(["summary", "full"]).default("summary")
    },
    outputSchema: EvidenceAuditOutputSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis, detail }) => {
    try {
      const packet = buildTeacherPacket({ minutesAvailable: prepMinutes(minutesAvailable), emphasis });
      const markdown = detail === "full" ? evidenceAuditMarkdown(packet) : evidenceAuditSummaryMarkdown(packet);
      return {
        content: textContent(markdown),
        structuredContent: {
          detail,
          modificationIds: packet.modifications.map((mod) => mod.id),
          contentChars: markdown.length,
          nextTool: detail === "summary" ? "render_evidence_audit({ detail: 'full' })" : undefined
        }
      };
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerPrompt(
  "differentiate_community_lesson",
  {
    description: "Compact handoff: summaries -> compact packet -> receipts.",
    argsSchema: {
      teacherNeed: z
        .string()
        .default("Modify tomorrow's 45-minute lesson for Learner 7A with minimal prep.")
        .describe("Teacher need.")
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
            "Use summary resources first: learner-profile-summary and community-lesson-summary.",
            "Call generate_teacher_packet({ detail: \"compact\" }) before any full read.",
            "Use explain_modification only for recommendations in the handout; request full audit only if quotes matter.",
            "Return a concise Tomorrow Mode handout with evidence IDs, RI.7.2 preserved, and no adult-facing labels in student text."
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
