import { describe, expect, it } from "vitest";
import {
  buildTeacherPacket,
  buildMcpPayloadLedger,
  buildSubmissionHealth,
  chooseModifications,
  compactTeacherPacket,
  evidenceAuditMarkdown,
  evidenceAuditSummaryMarkdown,
  evidenceTraceForModification,
  explainModification,
  type McpSmokeReceipt,
  reviewerWorkflowMarkdown,
  teacherPacketBriefMarkdown,
  reviewPacketQuality,
  showcaseData,
  teacherHandoutMarkdown
} from "./generator.js";
import { evidenceById, learnerProfile, lessonChunks, udlEvidence } from "./knowledge.js";
import {
  CompactTeacherPacketSchema,
  EvidenceRefSchema,
  HandoutSectionSchema,
  LearnerProfileSchema,
  LessonChunkSchema,
  QualityReportSchema,
  TeacherPacketSchema
} from "./schemas.js";
import { mcpManifestBudgets, mcpPromptBudgets } from "./mcp-budgets.js";

const measuredSmokeReceipt: McpSmokeReceipt = {
  result: "passed",
  startup: {
    tools: 7,
    resources: 6,
    prompts: 1,
    toolCatalogChars: 4733,
    toolCatalogBudgetChars: 5000,
    largestToolManifestChars: 900,
    largestToolManifestBudgetChars: 1000
  },
  prompt: {
    catalogChars: 240,
    catalogBudgetChars: 900,
    messageChars: 421,
    messageBudgetChars: 850
  },
  responses: [
    {
      tool: "generate_teacher_packet",
      mode: "compact",
      textChars: 604,
      textBudgetChars: 1200,
      structuredChars: 2695,
      structuredBudgetChars: 3200
    },
    {
      tool: "explain_modification",
      mode: "receipt",
      textChars: 569,
      textBudgetChars: 850,
      structuredChars: 2237,
      structuredBudgetChars: 2600
    },
    {
      tool: "render_evidence_audit",
      mode: "summary",
      textChars: 645,
      textBudgetChars: 1100,
      structuredChars: 196,
      structuredBudgetChars: 260
    }
  ],
  reviewerRule: "The default path spends context on decisions and IDs, then pulls quote-level receipts only when asked."
};

describe("teacher packet generation", () => {
  it("frames the public case with generic reviewer-safe labels", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });

    expect(packet.caseLabel).toBe("Learner 7A");
    expect(packet.teacherMode).toBe("Tomorrow Mode");
    expect(packet.evidenceSystem).toBe("Receipts Rail");
    expect(packet.qualityCheck).toBe("No Hand-Wavy Accommodations Detector");
    expect(JSON.stringify(packet)).not.toContain("Learner 7A's");
  });

  it("resolves every modification reference into typed evidence traces", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });

    expect(packet.groundingReport.missingGrounding).toEqual([]);
    for (const modification of packet.modifications) {
      const trace = evidenceTraceForModification(modification.id);
      const refs = [...modification.iepRefs, ...modification.lessonRefs, ...modification.udlRefs];

      expect(refs.every((ref) => evidenceById(ref))).toBe(true);
      expect(trace.iep.source).toBe("IEP");
      expect(trace.lesson.source).toBe("Lesson");
      expect(trace.udl.source).toBe("UDL");
      expect(trace.iepQuote).toBe(trace.iep.quote);
      expect(trace.lessonDemand).toBe(trace.lesson.quote);
      expect(trace.barrierAddressed.length).toBeGreaterThan(10);
      expect(trace.supportType).toMatch(/access|scaffold|material|assessment|monitoring|engagement/);
      expect(trace.progressCheck.length).toBeGreaterThan(10);
      expect(trace.standardPreserved).toBe("RI.7.2");
      expect(trace.udlAlignment.map((item) => item.principle)).toEqual(
        expect.arrayContaining([expect.stringMatching(/representation|engagement|action-expression/)])
      );
    }
  });

  it("preserves RI.7.2 instead of lowering the task", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });

    for (const modification of packet.modifications) {
      expect(modification.evidenceTrace.standardPreserved).toBe("RI.7.2");
      expect(modification.rationale).toMatch(/RI\.7\.2|central idea|evidence|definition|same prompt/i);
      expect(modification.teacherAction).not.toMatch(/skip|instead of the text|lower grade/i);
    }
  });

  it("keeps disability and legal labels out of student-facing materials", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const studentFacing = [
      ...packet.modifications.map((mod) => mod.studentFacingText),
      ...packet.miniMaterials.flatMap((material) => material.content),
      ...packet.exitTicket
    ].join(" ");

    expect(studentFacing).not.toMatch(/\b(IEP|disability|health impairment|accommodation)\b/i);
  });

  it("returns a smaller packet with matching materials when the teacher only has five minutes", () => {
    const quickPacket = buildTeacherPacket({ minutesAvailable: 5, emphasis: "minimum-viable" });
    const fullMods = chooseModifications(45, "full-support");
    const expectedMaterialIds = new Set(quickPacket.modifications.flatMap((mod) => mod.materialIds));

    expect(quickPacket.modifications.length).toBeLessThan(fullMods.length);
    expect(quickPacket.modifications.map((mod) => mod.id)).toEqual([
      "mod-annotation-code",
      "mod-checkin-before-independent",
      "mod-short-response-frame"
    ]);
    expect(quickPacket.miniMaterials.every((material) => expectedMaterialIds.has(material.id))).toBe(true);
    expect(quickPacket.miniMaterials.map((material) => material.id)).not.toContain("mat-newcastle-bridge");
  });

  it("quality review catches vague, unsupported, and unsafe recommendations", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const report = reviewPacketQuality({
      ...packet,
      modifications: [
        {
          ...packet.modifications[0],
          id: "bad-hand-wave",
          teacherAction: "Support as needed.",
          studentFacingText: "Because of your IEP accommodation, do an easier version.",
          rationale: "Helpful.",
          checkForUnderstanding: "",
          iepRefs: [],
          lessonRefs: [],
          udlRefs: [],
          evidenceTrace: undefined
        }
      ]
    });

    expect(report.passed).toBe(false);
    expect(report.flags.map((flag) => flag.kind)).toEqual(
      expect.arrayContaining(["vague-advice", "missing-evidence", "lowered-rigor", "unsafe-student-language"])
    );
  });

  it("quality review catches unsafe or orphan student materials", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const report = reviewPacketQuality({
      ...packet,
      miniMaterials: [
        ...packet.miniMaterials,
        {
          id: "mat-floating-label",
          name: "Unused adult-facing note",
          appliesTo: [],
          content: ["IEP accommodation: let the learner do less writing."]
        }
      ],
      exitTicket: [...packet.exitTicket, "Because of your disability, ask for help."]
    });

    expect(report.passed).toBe(false);
    expect(report.checks.unsafeStudentLanguage).toBe(false);
    expect(report.checks.materialsMatchRecommendations).toBe(false);
    expect(report.flags.map((flag) => flag.kind)).toEqual(
      expect.arrayContaining(["unsafe-student-language", "orphan-material"])
    );
  });

  it("renders Markdown artifacts as supporting evidence, not the whole pitch", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
    const handout = teacherHandoutMarkdown(packet);
    const audit = evidenceAuditMarkdown(packet);

    expect(handout).toContain("Tomorrow Mode");
    expect(handout).toContain("Before Class");
    expect(handout).toContain("Receipts Rail");
    expect(handout).not.toContain("Learner 7A's");
    expect(audit).toContain("No Hand-Wavy Accommodations Detector");
    expect(audit).toContain("RI.7.2");
  });

  it("keeps the default MCP packet compact and moves deep quotes behind receipts", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const compact = compactTeacherPacket(packet);
    const brief = teacherPacketBriefMarkdown(packet);
    const compactJson = JSON.stringify(compact);
    const fullJson = JSON.stringify(packet);

    expect(compact.detail).toBe("compact");
    expect(compactJson.length).toBeLessThan(fullJson.length * 0.3);
    expect(compactJson).not.toContain("iepQuote");
    expect(compactJson).not.toContain("lessonDemand");
    expect(compactJson).not.toContain("studentFacingText");
    expect(compactJson).not.toContain("rationale");
    expect(compact.nextTools).toHaveLength(3);
    expect(compact.nextTools.join(" ")).toContain("explain_modification");
    expect(compact.nextTools.join(" ")).toContain("review_packet_quality");
    expect(compact.nextTools.join(" ")).toContain("detail: 'full'");
    expect(compact.modifications.every((mod) => mod.receiptTool === "explain_modification")).toBe(true);
    expect(brief).toContain("Use `explain_modification` for quote-level evidence");
    expect(brief.length).toBeLessThan(compactJson.length * 0.2);
  });

  it("keeps on-demand receipts slim without hiding evidence", () => {
    const explanation = explainModification("mod-short-response-frame");
    const payload = JSON.stringify(explanation);

    expect(payload.length).toBeLessThan(2600);
    expect(payload).not.toContain("iepRefs");
    expect(payload).not.toContain("lessonRefs");
    expect(payload).not.toContain("udlRefs");
    expect(payload).not.toContain("rationale");
    expect(explanation.modification.teacherAction).toContain("claim-evidence-explain");
    expect(explanation.evidenceTrace.iepQuote).toContain("literal comprehension");
    expect(explanation.receipts.preservedStandard).toBe("RI.7.2");
  });

  it("renders a reviewer workflow that demonstrates compact-first MCP usage", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
    const workflow = reviewerWorkflowMarkdown(packet, undefined, measuredSmokeReceipt);

    expect(workflow).toContain("generate_teacher_packet");
    expect(workflow).toContain("explain_modification");
    expect(workflow).toContain("render_evidence_audit");
    expect(workflow).toContain("review_packet_quality");
    expect(workflow).toContain("detail: \"full\"");
    expect(workflow).toContain("mod-short-response-frame");
    expect(workflow).toContain("Standard preserved: RI.7.2");
    expect(workflow).toContain("## 5. Check The Meter");
    expect(workflow).toContain("Tool catalog: 4,733 / 5,000 characters.");
    expect(workflow).toContain("Prompt message: 421 / 850 characters.");
    expect(workflow).toContain("Compact packet response: 604 / 1,200 text chars; 2,695 / 3,200 structured chars.");
    expect(workflow).not.toContain("Learner 7A's");
  });

  it("renders compact evidence audits before quote-level tables", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
    const summary = evidenceAuditSummaryMarkdown(packet);
    const full = evidenceAuditMarkdown(packet);

    expect(summary).toContain("compact audit");
    expect(summary).toContain("mod-short-response-frame");
    expect(summary).toContain("Call render_evidence_audit({ detail: \"full\" })");
    expect(summary).not.toContain("| Modification | IEP quote | Lesson demand |");
    expect(summary.length).toBeLessThan(full.length * 0.45);
  });

  it("exposes payload stats for the visual showcase", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const data = showcaseData(packet, measuredSmokeReceipt);

    expect(data.mcpStats.compactChars).toBeLessThan(data.mcpStats.fullChars);
    expect(data.mcpStats.compactPercentOfFull).toBeLessThan(30);
    expect(data.mcpStats.defaultTool).toContain("compact");
    expect(data.mcpStats.onDemandTool).toBe("explain_modification");
    expect(data.mcpStats.catalogBudget.tool).toBe("tool catalog");
    expect(data.mcpStats.catalogBudget.budget).toBe(mcpManifestBudgets.toolCatalogMaxChars);
    expect(data.mcpStats.promptBudget.prompt).toBe("differentiate_community_lesson");
    expect(data.mcpStats.promptBudget.messageBudget).toBe(mcpPromptBudgets.promptMessageMaxChars);
    expect(data.mcpStats.measuredSmoke?.title).toBe("Real stdio meter");
    expect(data.mcpStats.measuredSmoke?.rows.map((row) => row.label)).toEqual(
      expect.arrayContaining(["tool catalog", "prompt message", "compact response", "one receipt"])
    );
    expect(data.mcpStats.measuredSmoke?.rows[0].value).toContain("4,733 / 5,000");
  });

  it("exposes packet-size modes so the showcase can prove the MCP is not one-size-fits-all", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const data = showcaseData(packet);

    expect(data.packetModes.map((mode) => mode.minutesAvailable)).toEqual([5, 15, 45]);
    expect(data.packetModes.map((mode) => mode.recommendations)).toEqual([3, 5, 9]);
    expect(data.packetModes.every((mode) => mode.compactPercentOfFull < 30)).toBe(true);
    expect(data.packetModes[0].compactChars).toBeLessThan(data.packetModes[1].compactChars);
    expect(data.packetModes[1].compactChars).toBeLessThan(data.packetModes[2].compactChars);
    expect(data.packetModes[0].defaultCall).toContain("minutesAvailable: 5");
    expect(data.packetModes[2].mode).toBe("full support");
  });

  it("exposes a click-through MCP flow without forcing every receipt into the first view", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const data = showcaseData(packet);

    expect(data.mcpFlow.map((step) => step.id)).toEqual(["packet", "receipt", "audit", "gate"]);
    expect(data.mcpFlow[0].command).toContain('detail: "compact"');
    expect(data.mcpFlow[0].structuredFields).toEqual(
      expect.arrayContaining(["modifications[]", "quality", "nextTools"])
    );
    expect(data.mcpFlow[0].hiddenPayload).toContain("deferred");
    expect(data.mcpFlow[1].structuredFields).toEqual(expect.arrayContaining(["evidenceTrace", "receipts"]));
    expect(data.mcpFlow[2].command).toContain("render_evidence_audit");
    expect(data.mcpFlow[3].response).toContain("passed");
    expect(data.mcpFlow.every((step) => step.textChars > 0 && step.structuredChars > 0)).toBe(true);
  });

  it("writes a payload ledger that reviewers can audit without opening the showcase", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const ledger = buildMcpPayloadLedger(packet);

    expect(ledger.defaultRhythm).toContain("compact packet");
    expect(ledger.budgets.startup.budget).toBe(mcpManifestBudgets.toolCatalogMaxChars);
    expect(ledger.budgets.prompts.messageBudget).toBe(mcpPromptBudgets.promptMessageMaxChars);
    expect(ledger.promptContract.route).toContain("generate compact packet before full detail");
    expect(ledger.packetModes.map((mode) => mode.minutesAvailable)).toEqual([5, 15, 45]);
    expect(ledger.packetModes.every((mode) => mode.compactPercentOfFull < ledger.budgets.compactPacketMaxPercentOfFull)).toBe(
      true
    );
    expect(ledger.callFlow.map((step) => step.id)).toEqual(["packet", "receipt", "audit", "gate"]);
    expect(ledger.callFlow[0].hiddenPayload).toContain("deferred");
    expect(ledger.callFlow[1].structuredFields).toContain("evidenceTrace");
    expect(JSON.stringify(ledger)).not.toMatch(/\bfull handout text\b/i);
  });

  it("renders a reviewer submission health artifact from the same packet", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const health = buildSubmissionHealth(packet);

    expect(health.product).toBe("Waypoint Differentiation Lab");
    expect(health.demo.liveUrl).toBe("https://cuuper22.github.io/waypoint-differentiation-lab/");
    expect(health.demo.localCommand).toBe("npm run showcase:dev");
    expect(health.mcp.defaultPayload).toBe("compact-first");
    expect(health.mcp.startupBudgetChars).toBe(mcpManifestBudgets.toolCatalogMaxChars);
    expect(health.mcp.promptMessageBudgetChars).toBe(mcpPromptBudgets.promptMessageMaxChars);
    expect(health.mcp.prompts).toEqual(["differentiate_community_lesson"]);
    expect(health.mcp.onDemandEvidenceTool).toBe("explain_modification");
    expect(health.evidence.generatedArtifacts).toEqual(
      expect.arrayContaining([
        "examples/teacher-handout.md",
        "examples/evidence-audit.md",
        "examples/quality-report.json",
        "examples/mcp-payload-ledger.json",
        "examples/mcp-smoke-report.json",
        "showcase/src/generated-data.js"
      ])
    );
    expect(health.evidence.traceFields).toEqual([
      "IEP quote",
      "lesson demand",
      "UDL alignment",
      "barrier addressed",
      "support type",
      "standard preserved",
      "progress check"
    ]);
    expect(health.quality.detector).toBe("No Hand-Wavy Accommodations Detector");
    expect(health.quality.requiredChecks).toEqual(
      expect.arrayContaining(["vague advice", "lowered rigor", "missing evidence", "unsafe student-facing language"])
    );
    expect(health.verification.primaryCommand).toBe("npm run submission:check");
    const forbiddenFraming = [
      ["AI", "generated"].join(" "),
      ["AI agent", "workflow"].join(" "),
      ["comprehensive", "solution"].join(" ")
    ].join("|");

    expect(health.reviewerPath[0]).toMatch(/visual walkthrough/i);
    expect(health.reviewerPath[2]).toContain("examples/mcp-smoke-report.json");
    expect(JSON.stringify(health)).not.toMatch(new RegExp(forbiddenFraming, "i"));
  });

  it("validates source resources and generated packets against public schemas", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 45, emphasis: "full-support" });
    const compact = compactTeacherPacket(packet);

    expect(() => LearnerProfileSchema.parse(learnerProfile)).not.toThrow();
    expect(() => lessonChunks.forEach((chunk) => LessonChunkSchema.parse(chunk))).not.toThrow();
    expect(() => udlEvidence.forEach((entry) => EvidenceRefSchema.parse(entry))).not.toThrow();
    expect(udlEvidence.every((entry) => entry.source === "UDL")).toBe(true);
    expect(() => TeacherPacketSchema.parse(packet)).not.toThrow();
    expect(() => CompactTeacherPacketSchema.parse(compact)).not.toThrow();
    expect(() => QualityReportSchema.parse(packet.qualityReport)).not.toThrow();
    expect(() => packet.handoutSections.forEach((section) => HandoutSectionSchema.parse(section))).not.toThrow();
  });
});
