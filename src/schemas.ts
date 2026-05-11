import * as z from "zod/v4";

export const EvidenceRefSchema = z.object({
  id: z.string(),
  source: z.enum(["IEP", "Lesson", "UDL"]),
  quote: z.string()
});

export const UdlAlignmentSchema = z.object({
  principle: z.enum(["representation", "engagement", "action-expression"]),
  checkpoint: z.string(),
  why: z.string()
});

export const EvidenceTraceSchema = z.object({
  modificationId: z.string(),
  iep: EvidenceRefSchema,
  lesson: EvidenceRefSchema,
  udl: EvidenceRefSchema,
  iepQuote: z.string(),
  lessonDemand: z.string(),
  udlAlignment: z.array(UdlAlignmentSchema),
  barrierAddressed: z.string(),
  supportType: z.enum(["access", "scaffold", "material", "assessment", "monitoring", "engagement"]),
  standardPreserved: z.literal("RI.7.2"),
  progressCheck: z.string()
});

export const MiniMaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  appliesTo: z.array(z.string()),
  content: z.array(z.string())
});

export const ModificationSchema = z.object({
  id: z.string(),
  category: z.enum([
    "access",
    "scaffolded-question",
    "modified-material",
    "alternative-assessment",
    "accommodation-reminder",
    "progress-monitoring"
  ]),
  phase: z.enum(["overview", "before-reading", "during-reading", "independent-practice", "discussion"]),
  priority: z.enum(["use-first", "build-out"]),
  supportType: z.enum(["access", "scaffold", "material", "assessment", "monitoring", "engagement"]),
  lessonMoment: z.string(),
  teacherAction: z.string(),
  studentFacingText: z.string(),
  rationale: z.string(),
  checkForUnderstanding: z.string(),
  timeCost: z.string(),
  prepMinutes: z.number(),
  materialIds: z.array(z.string()),
  iepRefs: z.array(z.string()),
  lessonRefs: z.array(z.string()),
  udlRefs: z.array(z.string()),
  evidenceTrace: EvidenceTraceSchema
});

export const HandoutSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(z.string())
});

export const QualityFlagSchema = z.object({
  kind: z.enum([
    "vague-advice",
    "missing-evidence",
    "lowered-rigor",
    "unsafe-student-language",
    "missing-progress-check",
    "missing-material"
  ]),
  modificationId: z.string(),
  message: z.string()
});

export const QualityReportSchema = z.object({
  name: z.literal("No Hand-Wavy Accommodations Detector"),
  passed: z.boolean(),
  checks: z.object({
    vagueAdvice: z.boolean(),
    loweredRigor: z.boolean(),
    missingEvidence: z.boolean(),
    unsafeStudentLanguage: z.boolean(),
    materialsMatchRecommendations: z.boolean()
  }),
  flags: z.array(QualityFlagSchema),
  summary: z.string()
});

export const TeacherPacketSchema = z.object({
  title: z.string(),
  caseLabel: z.literal("Learner 7A"),
  teacherMode: z.literal("Tomorrow Mode"),
  evidenceSystem: z.literal("Receipts Rail"),
  qualityCheck: z.literal("No Hand-Wavy Accommodations Detector"),
  studentSnapshot: z.string(),
  lessonSnapshot: z.string(),
  preservedStandard: z.literal("RI.7.2"),
  useFirst: z.array(z.string()),
  modifications: z.array(ModificationSchema),
  miniMaterials: z.array(MiniMaterialSchema),
  exitTicket: z.array(z.string()),
  handoutSections: z.array(HandoutSectionSchema),
  qualityReport: QualityReportSchema,
  groundingReport: z.object({
    totalModifications: z.number(),
    groundedInIepAndLesson: z.number(),
    missingGrounding: z.array(z.string())
  })
});

export const LearnerProfileSchema = z.object({
  caseLabel: z.literal("Learner 7A"),
  grade: z.string(),
  sourceNote: z.string(),
  learningImpact: z.string(),
  strengths: z.array(z.string()),
  needs: z.array(z.string()),
  accommodations: z.array(z.string()),
  goals: z.array(z.string()),
  evidence: z.array(EvidenceRefSchema)
});
