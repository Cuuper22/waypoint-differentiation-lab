import { describe, expect, it } from "vitest";
import {
  buildTeacherPacket,
  chooseModifications,
  compactTeacherPacket,
  evidenceAuditMarkdown,
  evidenceAuditSummaryMarkdown,
  evidenceTraceForModification,
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
import { mcpManifestBudgets } from "./mcp-budgets.js";

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

  it("renders a reviewer workflow that demonstrates compact-first MCP usage", () => {
    const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
    const workflow = reviewerWorkflowMarkdown(packet);

    expect(workflow).toContain("generate_teacher_packet");
    expect(workflow).toContain("explain_modification");
    expect(workflow).toContain("render_evidence_audit");
    expect(workflow).toContain("review_packet_quality");
    expect(workflow).toContain("detail: \"full\"");
    expect(workflow).toContain("mod-short-response-frame");
    expect(workflow).toContain("Standard preserved: RI.7.2");
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
    const data = showcaseData(packet);

    expect(data.mcpStats.compactChars).toBeLessThan(data.mcpStats.fullChars);
    expect(data.mcpStats.compactPercentOfFull).toBeLessThan(30);
    expect(data.mcpStats.defaultTool).toContain("compact");
    expect(data.mcpStats.onDemandTool).toBe("explain_modification");
    expect(data.mcpStats.catalogBudget.tool).toBe("tool catalog");
    expect(data.mcpStats.catalogBudget.budget).toBe(mcpManifestBudgets.toolCatalogMaxChars);
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
