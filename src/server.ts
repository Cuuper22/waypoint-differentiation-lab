#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod/v4";
import {
  buildTeacherPacket,
  compactTeacherPacket,
  evidenceAuditMarkdown,
  explainModification,
  learnerProfileSummary,
  lessonMapSummary,
  lessonMapMarkdown,
  reviewPacketQuality,
  studentProfileMarkdown,
  teacherPacketBriefMarkdown,
  teacherHandoutMarkdown
} from "./generator.js";
import { evidenceById, learnerProfile, lessonChunks } from "./knowledge.js";
import { QualityReportSchema } from "./schemas.js";

const server = new McpServer({
  name: "waypoint-differentiation-lab",
  version: "1.0.0"
});

const FlexibleObjectSchema = z.object({}).passthrough();

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
    outputSchema: FlexibleObjectSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ detail }) => {
    const profile = detail === "full" ? learnerProfile : learnerProfileSummary();
    return {
      content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
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
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ phase, includeEvidence }) => {
    const sourceChunks = includeEvidence ? lessonChunks : lessonMapSummary();
    const chunks = phase === "all" ? sourceChunks : sourceChunks.filter((chunk) => chunk.phase === phase);
    return {
      content: [{ type: "text", text: JSON.stringify(chunks, null, 2) }],
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
    outputSchema: FlexibleObjectSchema,
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
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ modificationId }) => {
    try {
      const explanation = explainModification(modificationId);
      return {
        content: [{ type: "text", text: JSON.stringify(explanation, null, 2) }],
        structuredContent: explanation
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text", text: error instanceof Error ? error.message : "Unknown modification error" }]
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
    outputSchema: QualityReportSchema,
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis }) => {
    const packet = buildTeacherPacket({ minutesAvailable, emphasis });
    const report = reviewPacketQuality(packet);
    return {
      content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
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
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ id }) => {
    const evidence = evidenceById(id);
    if (!evidence) {
      return {
        isError: true,
        content: [{ type: "text", text: `No evidence found for id: ${id}` }]
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(evidence, null, 2) }],
      structuredContent: evidence
    };
  }
);

server.registerTool(
  "render_evidence_audit",
  {
    title: "Render evidence audit",
    description: "Render the generated packet as a Markdown evidence audit for reviewers.",
    inputSchema: {
      minutesAvailable: z.union([z.literal(5), z.literal(15), z.literal(45)]).default(45),
      emphasis: z.enum(["minimum-viable", "balanced", "full-support"]).default("full-support")
    },
    annotations: { readOnlyHint: true, idempotentHint: true }
  },
  async ({ minutesAvailable, emphasis }) => {
    const packet = buildTeacherPacket({ minutesAvailable, emphasis });
    return {
      content: [{ type: "text", text: evidenceAuditMarkdown(packet) }],
      structuredContent: { markdown: evidenceAuditMarkdown(packet) }
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
            "Use the learner-profile and community-lesson-map resources.",
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
