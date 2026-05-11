export type EvidenceSource = "IEP" | "Lesson" | "UDL";

export type EvidenceRef = {
  id: string;
  source: EvidenceSource;
  quote: string;
};

export type UdlPrinciple = "representation" | "engagement" | "action-expression";

export type UdlAlignment = {
  principle: UdlPrinciple;
  checkpoint: string;
  why: string;
};

export type LearnerProfile = {
  caseLabel: string;
  grade: string;
  sourceNote: string;
  learningImpact: string;
  strengths: string[];
  needs: string[];
  accommodations: string[];
  goals: string[];
  evidence: EvidenceRef[];
};

export type LessonChunk = {
  id: string;
  phase: "overview" | "before-reading" | "during-reading" | "independent-practice" | "discussion";
  title: string;
  minutes: number;
  teacherMove: string;
  studentTask: string;
  evidence: EvidenceRef[];
};

export type SupportType = "access" | "scaffold" | "material" | "assessment" | "monitoring" | "engagement";

export type EvidenceTrace = {
  modificationId: string;
  iep: EvidenceRef;
  lesson: EvidenceRef;
  udl: EvidenceRef;
  iepQuote: string;
  lessonDemand: string;
  udlAlignment: UdlAlignment[];
  barrierAddressed: string;
  supportType: SupportType;
  standardPreserved: "RI.7.2";
  progressCheck: string;
};

export type Modification = {
  id: string;
  category:
    | "access"
    | "scaffolded-question"
    | "modified-material"
    | "alternative-assessment"
    | "accommodation-reminder"
    | "progress-monitoring";
  phase: LessonChunk["phase"];
  priority: "use-first" | "build-out";
  supportType: SupportType;
  lessonMoment: string;
  teacherAction: string;
  studentFacingText: string;
  rationale: string;
  checkForUnderstanding: string;
  timeCost: string;
  prepMinutes: number;
  materialIds: string[];
  iepRefs: string[];
  lessonRefs: string[];
  udlRefs: string[];
  evidenceTrace: EvidenceTrace;
};

export type MiniMaterial = {
  id: string;
  name: string;
  appliesTo: string[];
  content: string[];
};

export type HandoutSection = {
  id: string;
  title: string;
  items: string[];
};

export type QualityFlagKind =
  | "vague-advice"
  | "missing-evidence"
  | "lowered-rigor"
  | "unsafe-student-language"
  | "missing-progress-check"
  | "missing-material";

export type QualityFlag = {
  kind: QualityFlagKind;
  modificationId: string;
  message: string;
};

export type QualityReport = {
  name: "No Hand-Wavy Accommodations Detector";
  passed: boolean;
  checks: {
    vagueAdvice: boolean;
    loweredRigor: boolean;
    missingEvidence: boolean;
    unsafeStudentLanguage: boolean;
    materialsMatchRecommendations: boolean;
  };
  flags: QualityFlag[];
  summary: string;
};

export type CompactModification = {
  id: string;
  lessonMoment: string;
  supportType: SupportType;
  teacherAction: string;
  timeCost: string;
  materialIds: string[];
  refs: {
    iep: string[];
    lesson: string[];
    udl: string[];
  };
  standardPreserved: "RI.7.2";
  receiptTool: "explain_modification";
};

export type CompactTeacherPacket = {
  title: string;
  caseLabel: "Learner 7A";
  teacherMode: "Tomorrow Mode";
  detail: "compact";
  preservedStandard: "RI.7.2";
  useFirst: string[];
  modifications: CompactModification[];
  materialIds: string[];
  quality: {
    passed: boolean;
    summary: string;
  };
  nextTools: string[];
};

export type TeacherPacket = {
  title: string;
  caseLabel: "Learner 7A";
  teacherMode: "Tomorrow Mode";
  evidenceSystem: "Receipts Rail";
  qualityCheck: "No Hand-Wavy Accommodations Detector";
  studentSnapshot: string;
  lessonSnapshot: string;
  preservedStandard: "RI.7.2";
  useFirst: string[];
  modifications: Modification[];
  miniMaterials: MiniMaterial[];
  exitTicket: string[];
  handoutSections: HandoutSection[];
  qualityReport: QualityReport;
  groundingReport: {
    totalModifications: number;
    groundedInIepAndLesson: number;
    missingGrounding: string[];
  };
};
