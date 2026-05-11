import { evidenceById, learnerProfile, lessonChunks, udlEvidence } from "./knowledge.js";
import { mcpCatalogBudgetRow, mcpManifestBudgets, mcpResourceBudgetRows, mcpTextBudgetRows } from "./mcp-budgets.js";
import type {
  CompactTeacherPacket,
  EvidenceRef,
  EvidenceTrace,
  HandoutSection,
  MiniMaterial,
  Modification,
  QualityFlag,
  QualityReport,
  SubmissionHealth,
  SupportType,
  TeacherPacket,
  UdlAlignment
} from "./types.js";

export type PacketOptions = {
  minutesAvailable?: 5 | 15 | 45;
  emphasis?: "minimum-viable" | "balanced" | "full-support";
};

type ModificationDraft = Omit<Modification, "evidenceTrace"> & {
  barrierAddressed: string;
  udlAlignment: UdlAlignment[];
};

const STANDARD = "RI.7.2" as const;
const originalCaseName = ["Jas", "mine"].join("");

const modificationDrafts: ModificationDraft[] = [
  {
    id: "mod-preview-vocab",
    category: "access",
    phase: "before-reading",
    priority: "build-out",
    supportType: "access",
    lessonMoment: "Before reading: purpose and vocabulary",
    teacherAction:
      "Give Learner 7A a four-word preview card. For each word, say it, show a student-friendly meaning, and ask them to choose the matching example before the full text starts.",
    studentFacingText:
      "Today these words do work: aspect = one part, moral = about right and wrong, narrative = story, specific = exact. Put a check next to the word you expect to see in the definition of community.",
    rationale:
      "The lesson requires unit vocabulary in the RI.7.2 written response. Pre-teaching reduces decoding and meaning load before the learner meets the grade-level informational text.",
    checkForUnderstanding: "Ask the learner to point to the word that means story before paragraph 3.",
    timeCost: "2 minutes before reading",
    prepMinutes: 2,
    materialIds: ["mat-vocab-preview"],
    iepRefs: ["iep-reading-level", "iep-accommodations"],
    lessonRefs: ["lesson-vocab", "lesson-short-response"],
    udlRefs: ["udl-representation"],
    barrierAddressed: "Vocabulary load can block access to the central idea before the RI.7.2 work even begins.",
    udlAlignment: [
      {
        principle: "representation",
        checkpoint: "Clarify vocabulary and symbols.",
        why: "The core lesson stays intact while key words become usable before reading."
      }
    ]
  },
  {
    id: "mod-annotation-code",
    category: "modified-material",
    phase: "during-reading",
    priority: "use-first",
    supportType: "material",
    lessonMoment: "Paragraphs 1-2: claim and criteria",
    teacherAction:
      "Replace open annotation with a two-symbol code: box Lowe's claim and star three traits a definition of community must explain.",
    studentFacingText:
      "Box the sentence that tells Lowe's big claim. Star three bullets that tell what a community definition must explain.",
    rationale:
      "This preserves the RI.7.2 central-idea work while making annotation concrete enough for a learner whose goal includes prompt-focused annotation.",
    checkForUnderstanding: "The learner can show one boxed claim and three starred traits before answering the summary question.",
    timeCost: "No extra time; use during the first whole-class pause",
    prepMinutes: 1,
    materialIds: ["mat-annotation-key"],
    iepRefs: ["iep-ela-goal", "iep-comprehension-stamina"],
    lessonRefs: ["lesson-p1p2-claim", "lesson-p1p2-summary"],
    udlRefs: ["udl-representation", "udl-action-expression"],
    barrierAddressed: "Open-ended annotation creates too many choices, so the learner may not capture the claim or details.",
    udlAlignment: [
      {
        principle: "representation",
        checkpoint: "Highlight patterns, critical features, big ideas, and relationships.",
        why: "The box/star code makes the central idea and supporting details visually separable."
      },
      {
        principle: "action-expression",
        checkpoint: "Use tools for construction and composition.",
        why: "The learner can mark the grade-level text without inventing an annotation system."
      }
    ]
  },
  {
    id: "mod-scaffold-p1p2",
    category: "scaffolded-question",
    phase: "during-reading",
    priority: "build-out",
    supportType: "scaffold",
    lessonMoment: "During reading question C for paragraphs 1-2",
    teacherAction:
      "Ask the original question, then offer a response frame and selectable traits if Learner 7A stalls for more than 10 seconds.",
    studentFacingText:
      "A community can be different from a regular group because ____. A community can make people feel ____. A community can shape what people think is ____ or ____.",
    rationale:
      "The scaffold keeps the same RI.7.2 comprehension target but moves the learner from blank-page recall to recognition plus completion.",
    checkForUnderstanding: "The learner names at least three traits from paragraph 2, orally or in writing.",
    timeCost: "30 seconds at the pause point",
    prepMinutes: 1,
    materialIds: ["mat-traits-frame"],
    iepRefs: ["iep-reading-level", "iep-accommodations"],
    lessonRefs: ["lesson-p1p2-summary"],
    udlRefs: ["udl-action-expression"],
    barrierAddressed: "Independent recall is the bottleneck, not the target skill of identifying key traits.",
    udlAlignment: [
      {
        principle: "action-expression",
        checkpoint: "Support planning and strategy development.",
        why: "A frame gives the learner a path for showing the same central-idea understanding."
      }
    ]
  },
  {
    id: "mod-newcastle-bridge",
    category: "scaffolded-question",
    phase: "during-reading",
    priority: "build-out",
    supportType: "scaffold",
    lessonMoment: "Paragraphs 3-7: Newcastle example",
    teacherAction:
      "Use a two-column bridge chart: left side 'Newcastle detail from text,' right side 'How it proves shared story.' Complete the first row together.",
    studentFacingText:
      "Text detail: Lowe supports Newcastle United. This proves shared story because people in that community act out the same story together.",
    rationale:
      "The original RI.7.2 task asks how an example supports a definition. The chart makes the evidence-to-idea relationship visible without changing the prompt.",
    checkForUnderstanding: "The learner adds one more Newcastle detail and explains it with the phrase 'This proves... because...'.",
    timeCost: "2 minutes during partner reading",
    prepMinutes: 2,
    materialIds: ["mat-newcastle-bridge"],
    iepRefs: ["iep-ela-goal", "iep-comprehension-stamina"],
    lessonRefs: ["lesson-definition", "lesson-newcastle-question"],
    udlRefs: ["udl-representation", "udl-action-expression"],
    barrierAddressed: "The learner may find a detail but lose the reasoning step that connects evidence to the definition.",
    udlAlignment: [
      {
        principle: "representation",
        checkpoint: "Illustrate through multiple media.",
        why: "The chart turns an abstract definition-support relationship into a visible bridge."
      },
      {
        principle: "action-expression",
        checkpoint: "Build fluencies with graduated levels of support.",
        why: "The first row is modeled, then the learner completes the same kind of reasoning."
      }
    ]
  },
  {
    id: "mod-evidence-sorter",
    category: "modified-material",
    phase: "during-reading",
    priority: "build-out",
    supportType: "material",
    lessonMoment: "Paragraphs 8-11: why the definition matters",
    teacherAction:
      "Give a two-column evidence sorter labeled 'What community is' and 'Why community matters.' Learner 7A places two highlighted details before writing.",
    studentFacingText:
      "Put each detail where it fits: What community is, or Why community matters. Then choose one detail from each column for your answer.",
    rationale:
      "The lesson asks students to highlight evidence answering both questions. The sorter protects the RI.7.2 evidence-selection demand from becoming a memory pile.",
    checkForUnderstanding: "The learner places one accurate detail in each column and explains why one belongs there.",
    timeCost: "2 minutes during the paragraph 8-11 pause",
    prepMinutes: 2,
    materialIds: ["mat-evidence-sorter"],
    iepRefs: ["iep-ela-goal", "iep-comprehension-stamina"],
    lessonRefs: ["lesson-find-evidence", "lesson-social-change"],
    udlRefs: ["udl-representation", "udl-action-expression"],
    barrierAddressed: "The task requires sorting two kinds of evidence, which can overwhelm working memory during reading.",
    udlAlignment: [
      {
        principle: "representation",
        checkpoint: "Guide information processing and visualization.",
        why: "Sorting details by purpose makes the RI.7.2 evidence structure explicit."
      },
      {
        principle: "action-expression",
        checkpoint: "Use graphic organizers for composing and problem solving.",
        why: "The organizer becomes a bridge from highlighting to a written response."
      }
    ]
  },
  {
    id: "mod-checkin-before-independent",
    category: "accommodation-reminder",
    phase: "independent-practice",
    priority: "use-first",
    supportType: "engagement",
    lessonMoment: "Transition into independent practice",
    teacherAction:
      "Before independent work, do a quiet one-on-one check-in: repeat directions, point to the checklist, and agree on a first step. Use specific positive praise for starting.",
    studentFacingText:
      "First step: answer question 2 by finding the sentence that best states the central idea. I will check back after question 2.",
    rationale:
      "This uses documented supports and interrupts the withdrawal pattern before independent grade-level RI.7.2 reading becomes a shutdown trigger.",
    checkForUnderstanding: "The learner can state the first step and begin it within one minute.",
    timeCost: "45 seconds before independent work",
    prepMinutes: 0,
    materialIds: ["mat-first-step-card"],
    iepRefs: ["iep-accommodations", "iep-positive-praise", "iep-withdrawal-pattern"],
    lessonRefs: ["lesson-short-response", "lesson-self-checklist"],
    udlRefs: ["udl-engagement"],
    barrierAddressed: "Task initiation and stamina can collapse at the exact point the lesson shifts to independent work.",
    udlAlignment: [
      {
        principle: "engagement",
        checkpoint: "Sustain effort and persistence.",
        why: "A first-step agreement makes the independent task feel startable and gives the teacher a quick return point."
      }
    ]
  },
  {
    id: "mod-short-response-frame",
    category: "alternative-assessment",
    phase: "independent-practice",
    priority: "use-first",
    supportType: "assessment",
    lessonMoment: "Independent short response",
    teacherAction:
      "Keep the same prompt and evidence expectation, but provide a claim-evidence-explain frame and allow oral rehearsal before writing.",
    studentFacingText:
      "Claim: Lowe means a community is ____. Evidence 1: In paragraph __, he says ____. This shows ____. Evidence 2: In paragraph __, he says ____. This shows ____.",
    rationale:
      "The lesson asks for a written explanation with two details. The learner's goals name claim writing, evidence selection, and stamina, so the frame supports RI.7.2 access without lowering the target.",
    checkForUnderstanding: "Accept a rehearsed oral claim first, then require the written frame with two text details.",
    timeCost: "3 minutes setup; saves time during writing",
    prepMinutes: 3,
    materialIds: ["mat-short-response-frame"],
    iepRefs: ["iep-ela-goal", "iep-comprehension-stamina", "iep-accommodations"],
    lessonRefs: ["lesson-short-response", "lesson-self-checklist"],
    udlRefs: ["udl-action-expression"],
    barrierAddressed: "The learner can know the answer but run out of writing stamina before claim, evidence, and explanation all appear.",
    udlAlignment: [
      {
        principle: "action-expression",
        checkpoint: "Support executive functions and composition.",
        why: "Oral rehearsal plus a frame preserves the two-detail written response while reducing planning load."
      }
    ]
  },
  {
    id: "mod-discussion-role",
    category: "access",
    phase: "discussion",
    priority: "build-out",
    supportType: "engagement",
    lessonMoment: "Student-led discussion",
    teacherAction:
      "Give Learner 7A a defined peer role: evidence finder. They read one highlighted line from the text before sharing a personal-community answer.",
    studentFacingText:
      "My evidence from Lowe is: ____. My community example is: ____. These connect because ____.",
    rationale:
      "Peer talk and helping roles are motivating. The role turns discussion into structured RI.7.2 participation instead of an unbounded social task.",
    checkForUnderstanding: "The learner contributes once using text evidence and once using a personal example.",
    timeCost: "No extra time",
    prepMinutes: 1,
    materialIds: ["mat-discussion-role"],
    iepRefs: ["iep-positive-praise", "iep-profile-impact"],
    lessonRefs: ["lesson-discussion-community", "lesson-definition"],
    udlRefs: ["udl-engagement", "udl-action-expression"],
    barrierAddressed: "Discussion can become too open-ended, even though the learner is motivated by peer talk.",
    udlAlignment: [
      {
        principle: "engagement",
        checkpoint: "Optimize relevance, value, and authenticity.",
        why: "The role gives the learner a reason to participate with the text, not just around it."
      },
      {
        principle: "action-expression",
        checkpoint: "Use multiple media for communication.",
        why: "The learner can first read evidence aloud, then connect it in their own words."
      }
    ]
  },
  {
    id: "mod-progress-monitor",
    category: "progress-monitoring",
    phase: "discussion",
    priority: "build-out",
    supportType: "monitoring",
    lessonMoment: "End of lesson",
    teacherAction:
      "Record three quick data points: annotation completed, literal central-idea answer correct, claim frame started. This doubles as progress evidence without a second form.",
    studentFacingText:
      "Exit check: 1. My boxed claim is ____. 2. One detail that supports it is ____. 3. Today I used this strategy: annotate / reread / ask for help.",
    rationale:
      "The packet should help the teacher teach tomorrow and collect progress evidence for the same RI.7.2 comprehension and evidence goals.",
    checkForUnderstanding: "Teacher marks yes or not yet for each of the three data points.",
    timeCost: "1 minute",
    prepMinutes: 1,
    materialIds: ["mat-exit-check"],
    iepRefs: ["iep-ela-goal", "iep-withdrawal-pattern"],
    lessonRefs: ["lesson-skill-focus", "lesson-short-response"],
    udlRefs: ["udl-engagement", "udl-action-expression"],
    barrierAddressed: "Teachers need quick progress data, but extra paperwork after class is where good intentions go to take a nap.",
    udlAlignment: [
      {
        principle: "engagement",
        checkpoint: "Develop self-assessment and reflection.",
        why: "The exit check asks the learner to name the strategy used during the same lesson."
      },
      {
        principle: "action-expression",
        checkpoint: "Monitor progress.",
        why: "The teacher gets observable evidence tied to annotation, literal comprehension, and claim writing."
      }
    ]
  }
];

const miniMaterialsCatalog: MiniMaterial[] = [
  {
    id: "mat-vocab-preview",
    name: "Four-word preview card",
    appliesTo: ["mod-preview-vocab"],
    content: [
      "aspect = one part",
      "moral = about right and wrong",
      "narrative = story",
      "specific = exact",
      "Circle one word you expect to see in a definition of community."
    ]
  },
  {
    id: "mat-annotation-key",
    name: "Two-symbol annotation key",
    appliesTo: ["mod-annotation-code"],
    content: [
      "Box = Lowe's claim or definition.",
      "Star = detail that explains what makes a community different from a regular group."
    ]
  },
  {
    id: "mat-traits-frame",
    name: "Paragraph 2 trait frame",
    appliesTo: ["mod-scaffold-p1p2"],
    content: [
      "A community can be different from a regular group because ____.",
      "A community can make people feel ____.",
      "A community can shape what people think is ____ or ____."
    ]
  },
  {
    id: "mat-newcastle-bridge",
    name: "Newcastle bridge chart",
    appliesTo: ["mod-newcastle-bridge"],
    content: [
      "Text detail: Lowe supports Newcastle United. How it proves shared story: people in the community act out the same story together.",
      "Text detail: ________. How it proves shared story: ________."
    ]
  },
  {
    id: "mat-evidence-sorter",
    name: "Paragraph 8-11 evidence sorter",
    appliesTo: ["mod-evidence-sorter"],
    content: [
      "What community is: ________",
      "Why community matters: ________",
      "Best detail for my answer: ________"
    ]
  },
  {
    id: "mat-first-step-card",
    name: "First-step check-in card",
    appliesTo: ["mod-checkin-before-independent"],
    content: [
      "First step: answer question 2 by finding the sentence that best states the central idea.",
      "Check-back point: after question 2."
    ]
  },
  {
    id: "mat-short-response-frame",
    name: "Short-response frame",
    appliesTo: ["mod-short-response-frame"],
    content: [
      "Claim: Lowe means a community is ________.",
      "Evidence 1: In paragraph __, he says ________.",
      "This shows ________.",
      "Evidence 2: In paragraph __, he says ________.",
      "This shows ________."
    ]
  },
  {
    id: "mat-discussion-role",
    name: "Evidence finder discussion role",
    appliesTo: ["mod-discussion-role"],
    content: [
      "My evidence from Lowe is: ________.",
      "My community example is: ________.",
      "These connect because ________."
    ]
  },
  {
    id: "mat-exit-check",
    name: "Three-point exit check",
    appliesTo: ["mod-progress-monitor"],
    content: [
      "Boxed claim present: yes / not yet",
      "One literal central-idea answer correct: yes / not yet",
      "Claim frame started with evidence: yes / not yet",
      "Strategy used today: annotate / reread / ask for help / check-in"
    ]
  }
];

export const allModifications: Modification[] = modificationDrafts.map((draft) => attachTrace(draft));

export function buildTeacherPacket(options: PacketOptions = {}): TeacherPacket {
  const minutes = options.minutesAvailable ?? 45;
  const chosen = chooseModifications(minutes, options.emphasis ?? "balanced");
  const materialIds = new Set(chosen.flatMap((mod) => mod.materialIds));
  const miniMaterials = miniMaterialsCatalog.filter((material) => materialIds.has(material.id));

  const packetShell = {
    title: "Waypoint Differentiation Lab: community lesson packet",
    caseLabel: "Learner 7A" as const,
    teacherMode: "Tomorrow Mode" as const,
    evidenceSystem: "Receipts Rail" as const,
    qualityCheck: "No Hand-Wavy Accommodations Detector" as const,
    studentSnapshot:
      "Learner 7A can participate warmly when the route is clear, but needs explicit supports for informational-text comprehension, annotation, stamina, task initiation, and help-seeking before frustration turns into withdrawal.",
    lessonSnapshot:
      "The lesson asks seventh graders to determine and summarize the central idea of Toby Lowe's informational text: community is a shared, identity-forming narrative. The key deliverable is a short response using unit vocabulary and at least two text details.",
    preservedStandard: STANDARD,
    useFirst: [
      "Use the two-symbol annotation key during paragraphs 1-2.",
      "Do the 45-second first-step check-in before independent practice.",
      "Keep the original short-response prompt, but add the claim-evidence-explain frame."
    ],
    modifications: chosen,
    miniMaterials,
    exitTicket: [
      "Boxed claim present: yes / not yet",
      "One literal central-idea answer correct: yes / not yet",
      "Claim frame started with evidence: yes / not yet",
      "Strategy used today: annotate / reread / ask for help / check-in"
    ],
    handoutSections: [] as HandoutSection[],
    qualityReport: initialQualityReport(),
    groundingReport: groundingReport(chosen)
  };

  const packet: TeacherPacket = {
    ...packetShell,
    handoutSections: handoutSections(packetShell),
    qualityReport: initialQualityReport()
  };
  packet.qualityReport = reviewPacketQuality(packet);
  return packet;
}

export function compactTeacherPacket(packet: TeacherPacket): CompactTeacherPacket {
  return {
    title: packet.title,
    caseLabel: packet.caseLabel,
    teacherMode: packet.teacherMode,
    detail: "compact",
    preservedStandard: packet.preservedStandard,
    useFirst: packet.useFirst,
    modifications: packet.modifications.map((mod) => ({
      id: mod.id,
      lessonMoment: mod.lessonMoment,
      supportType: mod.supportType,
      teacherAction: mod.teacherAction,
      timeCost: mod.timeCost,
      materialIds: mod.materialIds,
      refs: {
        iep: mod.iepRefs,
        lesson: mod.lessonRefs,
        udl: mod.udlRefs
      },
      standardPreserved: mod.evidenceTrace.standardPreserved,
      receiptTool: "explain_modification"
    })),
    materialIds: packet.miniMaterials.map((material) => material.id),
    quality: {
      passed: packet.qualityReport.passed,
      summary: packet.qualityReport.summary
    },
    nextTools: [
      "explain_modification({ modificationId }) for quote-level receipts",
      "review_packet_quality({ minutesAvailable, emphasis }) for detector output",
      "generate_teacher_packet({ detail: 'full' }) only when you need full handout text"
    ]
  };
}

export function chooseModifications(minutes: 5 | 15 | 45, emphasis: PacketOptions["emphasis"]): Modification[] {
  const selectedIds =
    minutes === 5
      ? ["mod-annotation-code", "mod-checkin-before-independent", "mod-short-response-frame"]
      : minutes === 15 || emphasis === "minimum-viable"
        ? [
            "mod-preview-vocab",
            "mod-annotation-code",
            "mod-scaffold-p1p2",
            "mod-checkin-before-independent",
            "mod-short-response-frame"
          ]
        : allModifications.map((mod) => mod.id);

  return selectedIds.map((id) => {
    const modification = allModifications.find((mod) => mod.id === id);
    if (!modification) {
      throw new Error(`Unknown modification id: ${id}`);
    }
    return modification;
  });
}

export function evidenceTraceForModification(modificationId: string): EvidenceTrace {
  const draft = modificationDrafts.find((mod) => mod.id === modificationId);
  if (!draft) {
    throw new Error(`Unknown modification id: ${modificationId}`);
  }

  const iep = requiredEvidence(draft.iepRefs[0], "IEP");
  const lesson = requiredEvidence(draft.lessonRefs[0], "Lesson");
  const udl = requiredEvidence(draft.udlRefs[0], "UDL");

  return {
    modificationId,
    iep,
    lesson,
    udl,
    iepQuote: iep.quote,
    lessonDemand: lesson.quote,
    udlAlignment: draft.udlAlignment,
    barrierAddressed: draft.barrierAddressed,
    supportType: draft.supportType,
    standardPreserved: STANDARD,
    progressCheck: draft.checkForUnderstanding
  };
}

export function explainModification(modificationId: string) {
  const modification = allModifications.find((mod) => mod.id === modificationId);
  if (!modification) {
    throw new Error(`Unknown modification id: ${modificationId}`);
  }

  return {
    modification: {
      id: modification.id,
      lessonMoment: modification.lessonMoment,
      supportType: modification.supportType,
      teacherAction: modification.teacherAction,
      studentFacingText: modification.studentFacingText,
      timeCost: modification.timeCost,
      materialIds: modification.materialIds,
      standardPreserved: modification.evidenceTrace.standardPreserved
    },
    evidenceTrace: modification.evidenceTrace,
    receipts: {
      iep: modification.evidenceTrace.iep.id,
      lesson: modification.evidenceTrace.lesson.id,
      udl: modification.evidenceTrace.udl.id,
      preservedStandard: modification.evidenceTrace.standardPreserved,
      progressCheck: modification.evidenceTrace.progressCheck
    }
  };
}

export function reviewPacketQuality(packet: Pick<TeacherPacket, "modifications" | "miniMaterials" | "exitTicket">): QualityReport {
  const flags: QualityFlag[] = [];
  const materialIds = new Set(packet.miniMaterials.map((material) => material.id));
  const referencedMaterialIds = new Set(packet.modifications.flatMap((mod) => mod.materialIds ?? []));

  for (const mod of packet.modifications) {
    const studentFacingText = mod.studentFacingText ?? "";
    const teacherAction = mod.teacherAction ?? "";
    const rationale = mod.rationale ?? "";
    const allRefs = [...(mod.iepRefs ?? []), ...(mod.lessonRefs ?? []), ...(mod.udlRefs ?? [])];
    const refsResolve = allRefs.length > 0 && allRefs.every((ref) => evidenceById(ref));
    const hasTypedTrace =
      Boolean(mod.evidenceTrace) &&
      mod.evidenceTrace?.iep?.source === "IEP" &&
      mod.evidenceTrace?.lesson?.source === "Lesson" &&
      mod.evidenceTrace?.udl?.source === "UDL";

    if (!refsResolve || !hasTypedTrace) {
      flags.push({
        kind: "missing-evidence",
        modificationId: mod.id,
        message: "Recommendation does not resolve to IEP, lesson, and UDL evidence."
      });
    }

    if (isVague(teacherAction) || isVague(rationale)) {
      flags.push({
        kind: "vague-advice",
        modificationId: mod.id,
        message: "Recommendation sounds like a sticky note, not a teacher action."
      });
    }

    if (lowersRigor(mod, `${teacherAction} ${studentFacingText} ${rationale}`)) {
      flags.push({
        kind: "lowered-rigor",
        modificationId: mod.id,
        message: "Recommendation appears to change the RI.7.2 demand instead of preserving it."
      });
    }

    if (hasUnsafeStudentLanguage(studentFacingText)) {
      flags.push({
        kind: "unsafe-student-language",
        modificationId: mod.id,
        message: "Student-facing material leaks adult-facing labels or the original case name."
      });
    }

    if (!mod.checkForUnderstanding || mod.checkForUnderstanding.trim().length < 8) {
      flags.push({
        kind: "missing-progress-check",
        modificationId: mod.id,
        message: "Recommendation needs a visible check for understanding."
      });
    }

    for (const materialId of mod.materialIds ?? []) {
      if (!materialIds.has(materialId)) {
        flags.push({
          kind: "missing-material",
          modificationId: mod.id,
          message: `Referenced material ${materialId} is not included in the packet.`
        });
      }
    }
  }

  for (const material of packet.miniMaterials) {
    if (!referencedMaterialIds.has(material.id)) {
      flags.push({
        kind: "orphan-material",
        modificationId: material.id,
        message: `Material ${material.id} is included but no recommendation uses it.`
      });
    }

    if (hasUnsafeStudentLanguage([material.name, ...material.content].join(" "))) {
      flags.push({
        kind: "unsafe-student-language",
        modificationId: material.id,
        message: "Student-facing material leaks adult-facing labels or the original case name."
      });
    }
  }

  if (hasUnsafeStudentLanguage(packet.exitTicket.join(" "))) {
    flags.push({
      kind: "unsafe-student-language",
      modificationId: "exit-ticket",
      message: "Exit-ticket language leaks adult-facing labels or the original case name."
    });
  }

  const kinds = new Set(flags.map((flag) => flag.kind));
  const report: QualityReport = {
    name: "No Hand-Wavy Accommodations Detector",
    passed: flags.length === 0,
    checks: {
      vagueAdvice: !kinds.has("vague-advice"),
      loweredRigor: !kinds.has("lowered-rigor"),
      missingEvidence: !kinds.has("missing-evidence"),
      unsafeStudentLanguage: !kinds.has("unsafe-student-language"),
      materialsMatchRecommendations: !kinds.has("missing-material") && !kinds.has("orphan-material")
    },
    flags,
    summary:
      flags.length === 0
        ? "All recommendations are specific, evidence-grounded, RI.7.2-preserving, and safe to put in front of a student."
        : `${flags.length} issue(s) found before this should reach a teacher. The detector is doing its little clipboard job.`
  };

  return report;
}

export function groundingReport(mods: Modification[]) {
  const missingGrounding = mods
    .filter((mod) => mod.iepRefs.length === 0 || mod.lessonRefs.length === 0 || mod.udlRefs.length === 0)
    .map((mod) => mod.id);

  return {
    totalModifications: mods.length,
    groundedInIepAndLesson: mods.length - missingGrounding.length,
    missingGrounding
  };
}

export function teacherHandoutMarkdown(packet: TeacherPacket): string {
  const lines = [
    `# ${packet.teacherMode}: ${packet.title}`,
    "",
    `Case: ${packet.caseLabel}`,
    `Standard preserved: ${packet.preservedStandard}`,
    "",
    "## Before Class",
    ...packet.useFirst.map((item) => `- ${item}`),
    "",
    "## During Reading",
    ...packet.modifications
      .filter((mod) => mod.phase === "before-reading" || mod.phase === "during-reading")
      .map((mod) => `- ${mod.lessonMoment}: ${mod.teacherAction}`),
    "",
    "## Independent Practice",
    ...packet.modifications
      .filter((mod) => mod.phase === "independent-practice")
      .map((mod) => `- ${mod.lessonMoment}: ${mod.teacherAction}`),
    "",
    "## Student-Facing Materials",
    ...packet.miniMaterials.flatMap((material) => ["", `### ${material.name}`, ...material.content.map((item) => `- ${item}`)]),
    "",
    "## Exit Ticket",
    ...packet.exitTicket.map((item) => `- ${item}`),
    "",
    "## Receipts Rail",
    ...packet.modifications.map(
      (mod) =>
        `- ${mod.id}: ${mod.evidenceTrace.iep.id}, ${mod.evidenceTrace.lesson.id}, ${mod.evidenceTrace.udl.id}; preserves ${mod.evidenceTrace.standardPreserved}.`
    )
  ];

  return lines.join("\n");
}

export function teacherPacketBriefMarkdown(packet: TeacherPacket): string {
  const compact = compactTeacherPacket(packet);
  return [
    `# ${compact.teacherMode}: compact packet`,
    "",
    `Case: ${compact.caseLabel}`,
    `Standard preserved: ${compact.preservedStandard}`,
    `Quality: ${compact.quality.passed ? "passed" : "needs review"}`,
    `Recommendations: ${compact.modifications.length}`,
    `Materials: ${compact.materialIds.length}`,
    "",
    "## Use first",
    ...compact.useFirst.map((item) => `- ${item}`),
    "",
    "## Included IDs",
    compact.modifications.map((mod) => mod.id).join(", "),
    "",
    "Read `structuredContent.modifications` for actions and refs. Use `explain_modification` for quote-level evidence only when a recommendation needs inspection."
  ].join("\n");
}

export function reviewerWorkflowMarkdown(packet: TeacherPacket, modificationId = "mod-short-response-frame"): string {
  const compact = compactTeacherPacket(packet);
  const compactJson = JSON.stringify(compact);
  const fullJson = JSON.stringify(packet);
  const auditSummary = evidenceAuditSummaryMarkdown(packet);
  const fullAudit = evidenceAuditMarkdown(packet);
  const selected = compact.modifications.find((modification) => modification.id === modificationId);
  if (!selected) {
    throw new Error(`Cannot render reviewer workflow for missing modification: ${modificationId}`);
  }

  const explanation = explainModification(modificationId);
  const trace = explanation.evidenceTrace;
  const sizePercent = Math.round((compactJson.length / fullJson.length) * 100);
  const auditPercent = Math.round((auditSummary.length / fullAudit.length) * 100);

  return [
    "# Reviewer Workflow: Compact First, Receipts On Demand",
    "",
    "A reviewer can see the whole MCP shape without asking the client to swallow the whole packet first.",
    "",
    "## 1. Start Small",
    "",
    "`generate_teacher_packet({ minutesAvailable: 15, emphasis: \"balanced\", detail: \"compact\" })`",
    "",
    `- Compact payload: ${compactJson.length.toLocaleString("en-US")} characters`,
    `- Full packet payload: ${fullJson.length.toLocaleString("en-US")} characters`,
    `- Default call is ${sizePercent}% of the full packet, under the 30% payload budget enforced by tests.`,
    "- It keeps recommendation IDs, short actions, material IDs, and next-tool hints intact.",
    `- Quality status: ${compact.quality.passed ? "passed" : "needs review"}`,
    "",
    "Use-first recommendations:",
    ...compact.useFirst.map((item) => `- ${item}`),
    "",
    "## 2. Pull One Receipt",
    "",
    `\`explain_modification({ modificationId: "${modificationId}" })\``,
    "",
    `Recommendation: ${selected.lessonMoment}`,
    `Teacher action: ${selected.teacherAction}`,
    "",
    "Receipt:",
    `- IEP quote: ${trace.iepQuote}`,
    `- Lesson demand: ${trace.lessonDemand}`,
    `- UDL: ${trace.udlAlignment.map((item) => `${item.principle} (${item.checkpoint})`).join("; ")}`,
    `- Barrier: ${trace.barrierAddressed}`,
    `- Standard preserved: ${trace.standardPreserved}`,
    `- Progress check: ${trace.progressCheck}`,
    "",
    "## 3. Scan The Rail",
    "",
    "`render_evidence_audit({ minutesAvailable: 15, emphasis: \"balanced\" })`",
    "",
    `- Default audit summary: ${auditSummary.length.toLocaleString("en-US")} characters`,
    `- Full quote table: ${fullAudit.length.toLocaleString("en-US")} characters`,
    `- Summary call is ${auditPercent}% of the full audit and keeps every evidence ref visible.`,
    "- Use `render_evidence_audit({ detail: \"full\" })` only when a reviewer wants the quote table.",
    "",
    "## 4. Run The Gate",
    "",
    "`review_packet_quality({ minutesAvailable: 15, emphasis: \"balanced\" })`",
    "",
    `Detector: ${packet.qualityReport.name}`,
    `Result: ${packet.qualityReport.summary}`,
    "",
    "That is the intended MCP rhythm: compact packet first, one receipt when a recommendation earns inspection, compact audit when the whole rail needs scanning, full handout only when the client is ready to present it."
  ].join("\n");
}

export function evidenceAuditSummaryMarkdown(packet: TeacherPacket): string {
  return [
    `# ${packet.evidenceSystem}: compact audit`,
    "",
    `Quality: ${packet.qualityReport.passed ? "passed" : "needs review"}`,
    ...packet.modifications.map(
      (mod) =>
        `- ${mod.id}: ${[...mod.iepRefs, ...mod.lessonRefs, ...mod.udlRefs].join(", ")}; preserves ${mod.evidenceTrace.standardPreserved}.`
    ),
    "",
    "Call render_evidence_audit({ detail: \"full\" }) for quote-level table output."
  ].join("\n");
}

export function evidenceAuditMarkdown(packet: TeacherPacket): string {
  const lines = [
    `# ${packet.evidenceSystem}`,
    "",
    `Quality gate: ${packet.qualityCheck}`,
    `Result: ${packet.qualityReport.passed ? "passed" : "needs review"}`,
    "",
    "| Modification | IEP quote | Lesson demand | UDL | Barrier | Standard | Progress check |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  ];

  for (const mod of packet.modifications) {
    const trace = mod.evidenceTrace;
    lines.push(
      `| ${mod.id} | ${escapeTable(trace.iepQuote)} | ${escapeTable(trace.lessonDemand)} | ${escapeTable(
        trace.udlAlignment.map((item) => item.principle).join(", ")
      )} | ${escapeTable(trace.barrierAddressed)} | ${trace.standardPreserved} | ${escapeTable(trace.progressCheck)} |`
    );
  }

  if (packet.qualityReport.flags.length > 0) {
    lines.push("", "## Flags", ...packet.qualityReport.flags.map((flag) => `- ${flag.kind}: ${flag.message}`));
  }

  return lines.join("\n");
}

export function lessonMapMarkdown(): string {
  return lessonChunks
    .map(
      (chunk) =>
        `## ${chunk.title}\nPhase: ${chunk.phase}\nTime: ${chunk.minutes} minutes\nTeacher move: ${chunk.teacherMove}\nStudent task: ${chunk.studentTask}\nEvidence: ${chunk.evidence
          .map((entry) => `${entry.id}: ${entry.quote}`)
          .join(" ")}`
    )
    .join("\n\n");
}

export function lessonMapSummary() {
  return lessonChunks.map((chunk) => ({
    id: chunk.id,
    phase: chunk.phase,
    title: chunk.title,
    minutes: chunk.minutes,
    studentTask: chunk.studentTask,
    evidenceIds: chunk.evidence.map((entry) => entry.id)
  }));
}

export function lessonMapSummaryMarkdown(): string {
  return [
    "# Community lesson summary",
    "Standard: RI.7.2 central idea, objective summary, and supporting details stay preserved.",
    "Start light: call generate_teacher_packet detail:compact first. Read the full lesson map only when quote text changes the answer.",
    "",
    "Chunks:",
    ...lessonMapSummary().map(
      (chunk) =>
        `- ${chunk.id} (${chunk.phase}, ${chunk.minutes}m): ${chunk.title}. Evidence IDs: ${chunk.evidenceIds.join(", ")}.`
    ),
    "",
    "Full map: waypoint://lesson/community/map"
  ].join("\n");
}

export function studentProfileMarkdown(): string {
  return [
    `# ${learnerProfile.caseLabel}, Grade ${learnerProfile.grade}`,
    learnerProfile.sourceNote,
    "",
    `Learning impact: ${learnerProfile.learningImpact}`,
    "## Strengths",
    ...learnerProfile.strengths.map((item) => `- ${item}`),
    "## Needs",
    ...learnerProfile.needs.map((item) => `- ${item}`),
    "## Supports",
    ...learnerProfile.accommodations.map((item) => `- ${item}`),
    "## Goals",
    ...learnerProfile.goals.map((item) => `- ${item}`),
    "## Evidence",
    ...learnerProfile.evidence.map((entry) => `- ${entry.id}: ${entry.quote}`)
  ].join("\n");
}

export function learnerProfileSummary() {
  return {
    caseLabel: learnerProfile.caseLabel,
    grade: learnerProfile.grade,
    learningImpact: learnerProfile.learningImpact,
    strengths: learnerProfile.strengths,
    needs: learnerProfile.needs,
    supportIds: learnerProfile.evidence.map((entry) => entry.id),
    sourceNote: learnerProfile.sourceNote
  };
}

export function learnerProfileSummaryMarkdown(): string {
  const summary = learnerProfileSummary();
  return [
    `# ${summary.caseLabel} summary`,
    `Grade: ${summary.grade}.`,
    "Planning barriers: attention, task initiation, stamina, and informational-text comprehension.",
    "Use strengths: peer talk, helping roles, concrete praise, and structured choice.",
    "Plan for: chunked reading, modeled summaries, visible steps, movement reset, and quick check-ins.",
    `Evidence IDs: ${summary.supportIds.join(", ")}.`,
    "Full profile: waypoint://case/learner-7a/profile"
  ].join("\n");
}

export function showcaseData(packet: TeacherPacket) {
  const compact = compactTeacherPacket(packet);
  const compactChars = JSON.stringify(compact).length;
  const fullChars = JSON.stringify(packet).length;
  const packetModes = [
    { minutesAvailable: 5 as const, emphasis: "minimum-viable" as const, mode: "five-minute triage" },
    { minutesAvailable: 15 as const, emphasis: "balanced" as const, mode: "balanced pass" },
    { minutesAvailable: 45 as const, emphasis: "full-support" as const, mode: "full support" }
  ].map(({ minutesAvailable, emphasis, mode }) => {
    const modePacket = buildTeacherPacket({ minutesAvailable, emphasis });
    const modeCompact = compactTeacherPacket(modePacket);
    const modeCompactChars = JSON.stringify(modeCompact).length;
    const modeFullChars = JSON.stringify(modePacket).length;

    return {
      mode,
      minutesAvailable,
      emphasis,
      defaultCall: `generate_teacher_packet({ minutesAvailable: ${minutesAvailable}, emphasis: "${emphasis}", detail: "compact" })`,
      compactChars: modeCompactChars,
      fullChars: modeFullChars,
      compactPercentOfFull: Math.round((modeCompactChars / modeFullChars) * 100),
      savedPercent: Math.round((1 - modeCompactChars / modeFullChars) * 100),
      recommendations: modePacket.modifications.length,
      materials: modePacket.miniMaterials.length,
      useFirst: modePacket.useFirst,
      modificationIds: modePacket.modifications.map((modification) => modification.id)
    };
  });
  const flowPacket = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
  const flowCompact = compactTeacherPacket(flowPacket);
  const flowBrief = teacherPacketBriefMarkdown(flowPacket);
  const flowReceipt = explainModification("mod-short-response-frame");
  const flowReceiptText = [
    `Receipt for ${flowReceipt.modification.lessonMoment}`,
    flowReceipt.modification.teacherAction,
    `${flowReceipt.evidenceTrace.supportType}; preserves ${flowReceipt.evidenceTrace.standardPreserved}.`
  ].join("\n");
  const auditSummary = evidenceAuditSummaryMarkdown(flowPacket);
  const fullAudit = evidenceAuditMarkdown(flowPacket);
  const auditStructured = {
    detail: "summary",
    modificationIds: flowPacket.modifications.map((modification) => modification.id),
    contentChars: auditSummary.length,
    nextTool: 'render_evidence_audit({ detail: "full" })'
  };
  const gateText = `${flowPacket.qualityReport.name}: ${
    flowPacket.qualityReport.passed ? "passed" : "needs review"
  }. ${flowPacket.qualityReport.summary}`;
  const flowFullChars = JSON.stringify(flowPacket).length;
  const flowCompactChars = JSON.stringify(flowCompact).length;
  const receiptChars = JSON.stringify(flowReceipt).length;
  const auditStructuredChars = JSON.stringify(auditStructured).length;
  const gateStructuredChars = JSON.stringify(flowPacket.qualityReport).length;
  const mcpFlow = [
    {
      id: "packet",
      badge: "01",
      label: "Compact packet",
      command: 'generate_teacher_packet({ minutesAvailable: 15, emphasis: "balanced", detail: "compact" })',
      textPreview: "Brief teacher-facing handoff plus IDs, quality status, and next-tool hints.",
      textChars: flowBrief.length,
      structuredChars: flowCompactChars,
      hiddenPayload: `${(flowFullChars - flowCompactChars).toLocaleString("en-US")} chars deferred until full detail is requested`,
      response: [
        `${flowCompact.modifications.length} recommendations`,
        `${flowCompact.materialIds.length} material refs`,
        `${Math.round((flowCompactChars / flowFullChars) * 100)}% of full packet`
      ],
      structuredFields: ["title", "useFirst", "modifications[]", "materialIds", "quality", "nextTools"]
    },
    {
      id: "receipt",
      badge: "02",
      label: "One receipt",
      command: 'explain_modification({ modificationId: "mod-short-response-frame" })',
      textPreview: "One inspected recommendation gets the evidence trace, not the entire packet again.",
      textChars: flowReceiptText.length,
      structuredChars: receiptChars,
      hiddenPayload: "Other receipts stay out of context until clicked",
      response: [
        flowReceipt.evidenceTrace.supportType,
        flowReceipt.evidenceTrace.standardPreserved,
        flowReceipt.evidenceTrace.udlAlignment.map((item) => item.principle).join(" + ")
      ],
      structuredFields: ["modification", "evidenceTrace", "receipts"]
    },
    {
      id: "audit",
      badge: "03",
      label: "Audit summary",
      command: 'render_evidence_audit({ minutesAvailable: 15, emphasis: "balanced" })',
      textPreview: "A compact ref index lets a reviewer scan grounding before asking for quote tables.",
      textChars: auditSummary.length,
      structuredChars: auditStructuredChars,
      hiddenPayload: `${(fullAudit.length - auditSummary.length).toLocaleString("en-US")} quote-table chars deferred`,
      response: [
        `${flowPacket.modifications.length} refs visible`,
        `${Math.round((auditSummary.length / fullAudit.length) * 100)}% of full audit`,
        "full table stays opt-in"
      ],
      structuredFields: ["detail", "modificationIds", "contentChars", "nextTool"]
    },
    {
      id: "gate",
      badge: "04",
      label: "Quality gate",
      command: 'review_packet_quality({ minutesAvailable: 15, emphasis: "balanced" })',
      textPreview: "The verdict is short; the flags and check booleans stay structured for clients.",
      textChars: gateText.length,
      structuredChars: gateStructuredChars,
      hiddenPayload: "No repeated packet body in the quality call",
      response: [
        flowPacket.qualityReport.passed ? "passed" : "needs review",
        "vague advice: blocked",
        "unsafe language: blocked"
      ],
      structuredFields: ["name", "passed", "checks", "flags", "summary"]
    }
  ];

  return {
    title: "Waypoint Differentiation Lab",
    thesis: "Turn one lesson map and one learner profile into tomorrow's evidence-grounded supports.",
    packet: {
      caseLabel: packet.caseLabel,
      teacherMode: packet.teacherMode,
      evidenceSystem: packet.evidenceSystem,
      qualityCheck: packet.qualityCheck,
      preservedStandard: packet.preservedStandard,
      lessonSnapshot: packet.lessonSnapshot,
      useFirst: packet.useFirst,
      qualityReport: packet.qualityReport
    },
    mcpStats: {
      compactChars,
      fullChars,
      compactPercentOfFull: Math.round((compactChars / fullChars) * 100),
      savedPercent: Math.round((1 - compactChars / fullChars) * 100),
      defaultTool: "generate_teacher_packet detail=compact",
      onDemandTool: "explain_modification",
      catalogBudget: mcpCatalogBudgetRow,
      resourceBudgets: mcpResourceBudgetRows,
      textBudgets: mcpTextBudgetRows
    },
    packetModes,
    mcpFlow,
    modifications: packet.modifications.map((mod) => ({
      id: mod.id,
      lessonMoment: mod.lessonMoment,
      category: mod.category,
      supportType: mod.supportType,
      teacherAction: mod.teacherAction,
      studentFacingText: mod.studentFacingText,
      rationale: mod.rationale,
      timeCost: mod.timeCost,
      evidenceTrace: mod.evidenceTrace
    })),
    miniMaterials: packet.miniMaterials,
    architecture: [
      "Resources: learner profile and lesson map",
      "Tools: generate packet, explain modification, review quality",
      "Generator: deterministic TypeScript rules with typed evidence traces",
      "Presentation: Claude or any MCP client turns the packet into teacher-ready prose"
    ]
  };
}

export function buildMcpPayloadLedger(packet: TeacherPacket) {
  const data = showcaseData(packet);
  return {
    artifact: "mcp-payload-ledger",
    purpose: "Show the compact-first MCP contract, packet-size modes, and deferred evidence costs from generated data.",
    defaultRhythm: "compact packet -> one receipt -> compact audit -> quality gate",
    budgets: {
      startup: data.mcpStats.catalogBudget,
      compactPacketMaxPercentOfFull: 30,
      resources: data.mcpStats.resourceBudgets,
      textResponses: data.mcpStats.textBudgets
    },
    packetModes: data.packetModes.map((mode) => ({
      mode: mode.mode,
      minutesAvailable: mode.minutesAvailable,
      emphasis: mode.emphasis,
      compactChars: mode.compactChars,
      fullChars: mode.fullChars,
      compactPercentOfFull: mode.compactPercentOfFull,
      recommendations: mode.recommendations,
      materials: mode.materials
    })),
    callFlow: data.mcpFlow.map((step) => ({
      id: step.id,
      command: step.command,
      contentChars: step.textChars,
      structuredContentChars: step.structuredChars,
      hiddenPayload: step.hiddenPayload,
      structuredFields: step.structuredFields
    })),
    reviewerRule: "Default calls should tell the client what to do next without spending context on quote tables or full handouts."
  };
}

export function buildSubmissionHealth(packet: TeacherPacket): SubmissionHealth {
  return {
    product: "Waypoint Differentiation Lab",
    thesis: "One lesson map plus one pseudonymized learner profile becomes tomorrow's evidence-grounded teacher packet.",
    demo: {
      liveUrl: "https://cuuper22.github.io/waypoint-differentiation-lab/",
      localCommand: "npm run showcase:dev",
      previewGif: "assets/showcase-preview.gif",
      guidedCommand: "npm run demo:reviewer",
      qaCommand: "npm run qa:showcase"
    },
    mcp: {
      defaultPayload: "compact-first",
      startupBudgetChars: mcpManifestBudgets.toolCatalogMaxChars,
      compactPacketMaxPercentOfFull: 30,
      onDemandEvidenceTool: "explain_modification",
      tools: [
        "generate_teacher_packet",
        "explain_modification",
        "review_packet_quality",
        "get_learner_profile",
        "get_lesson_map",
        "explain_evidence",
        "render_evidence_audit"
      ],
      resources: [
        "waypoint://case/learner-7a/summary",
        "waypoint://case/learner-7a/profile",
        "waypoint://lesson/community/summary",
        "waypoint://lesson/community/map",
        "waypoint://packet/community/learner-7a",
        "waypoint://packet/community/learner-7a/handout"
      ]
    },
    evidence: {
      generatedArtifacts: [
        "examples/teacher-handout.md",
        "examples/evidence-audit.md",
        "examples/reviewer-workflow.md",
        "examples/quality-report.json",
        "examples/compact-packet.json",
        "examples/sample-packet.json",
        "examples/mcp-payload-ledger.json",
        "examples/submission-health.json",
        "showcase/src/generated-data.js"
      ],
      recommendations: packet.modifications.length,
      materials: packet.miniMaterials.length,
      evidenceTraces: packet.modifications.filter(
        (modification) => modification.evidenceTrace.standardPreserved === "RI.7.2"
      ).length,
      preservedStandard: packet.preservedStandard,
      traceFields: [
        "IEP quote",
        "lesson demand",
        "UDL alignment",
        "barrier addressed",
        "support type",
        "standard preserved",
        "progress check"
      ]
    },
    quality: {
      detector: packet.qualityCheck,
      passed: packet.qualityReport.passed,
      requiredChecks: [
        "vague advice",
        "lowered rigor",
        "missing evidence",
        "unsafe student-facing language",
        "matching mini materials"
      ]
    },
    verification: {
      primaryCommand: "npm run submission:check",
      smokeCommand: "npm run smoke:mcp",
      visualQaCommand: "npm run qa:showcase"
    },
    reviewerPath: [
      "Open the visual walkthrough and play the guided reviewer demo.",
      "Skim examples/submission-health.json for the packet, MCP, evidence, and verification map.",
      "Run npm run submission:check to rebuild artifacts, test contracts, smoke the MCP, and QA the browser walkthrough.",
      "Inspect examples/evidence-audit.md or call explain_modification when a recommendation needs receipts."
    ]
  };
}

function attachTrace(draft: ModificationDraft): Modification {
  const { barrierAddressed: _barrierAddressed, udlAlignment: _udlAlignment, ...modification } = draft;
  return {
    ...modification,
    evidenceTrace: evidenceTraceForModification(draft.id)
  };
}

function requiredEvidence(id: string | undefined, source: EvidenceRef["source"]): EvidenceRef {
  if (!id) {
    throw new Error(`Missing ${source} evidence reference`);
  }
  const evidence = evidenceById(id);
  if (!evidence || evidence.source !== source) {
    throw new Error(`Evidence ${id} did not resolve to source ${source}`);
  }
  return evidence;
}

function handoutSections(packet: Pick<TeacherPacket, "useFirst" | "modifications" | "miniMaterials" | "exitTicket">): HandoutSection[] {
  return [
    {
      id: "before-class",
      title: "Before Class",
      items: packet.useFirst
    },
    {
      id: "during-reading",
      title: "During Reading",
      items: packet.modifications
        .filter((mod) => mod.phase === "before-reading" || mod.phase === "during-reading")
        .map((mod) => `${mod.lessonMoment}: ${mod.teacherAction}`)
    },
    {
      id: "independent-practice",
      title: "Independent Practice",
      items: packet.modifications
        .filter((mod) => mod.phase === "independent-practice")
        .map((mod) => `${mod.lessonMoment}: ${mod.teacherAction}`)
    },
    {
      id: "materials",
      title: "Mini Materials",
      items: packet.miniMaterials.map((material) => material.name)
    },
    {
      id: "exit-ticket",
      title: "Exit Ticket",
      items: packet.exitTicket
    }
  ];
}

function initialQualityReport(): QualityReport {
  return {
    name: "No Hand-Wavy Accommodations Detector",
    passed: true,
    checks: {
      vagueAdvice: true,
      loweredRigor: true,
      missingEvidence: true,
      unsafeStudentLanguage: true,
      materialsMatchRecommendations: true
    },
    flags: [],
    summary: "Review pending."
  };
}

function isVague(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return normalized.length < 18 || /\b(support as needed|help as needed|modify as needed|provide support|be flexible)\b/.test(normalized);
}

function hasUnsafeStudentLanguage(text: string): boolean {
  const adultLabels = new RegExp(`\\b(IEP|disability|health impairment|accommodation|${originalCaseName}|Learner 7A)\\b`, "i");
  return adultLabels.test(text);
}

function lowersRigor(mod: Modification, text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    mod.evidenceTrace?.standardPreserved !== STANDARD ||
    /\b(easier version|skip the text|lower grade|replace the grade-level task|do less)\b/.test(normalized)
  );
}

function escapeTable(text: string): string {
  return text.replaceAll("|", "\\|").replaceAll("\n", " ");
}
