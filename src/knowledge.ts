import type { EvidenceRef, LearnerProfile, LessonChunk } from "./types.js";

export const learnerProfile: LearnerProfile = {
  caseLabel: "Learner 7A",
  grade: "7",
  sourceNote:
    "Pseudonymized, reduced classroom-planning context derived from the Waypoint challenge packet. Original student name is not re-published in this repo.",
  learningImpact:
    "Attention, task initiation, focus, stamina, and study skills affect how the learner starts, persists through, and independently finishes grade-level reading work.",
  strengths: [
    "Shows up ready to learn and contributes thoughtful comments when the task feels navigable.",
    "Responds well to specific positive praise, peer talk, helping roles, and short adult check-ins.",
    "Can decode most grade-level words with adequate fluency when comprehension load is managed."
  ],
  needs: [
    "Needs support turning grade-level informational text into literal central-idea answers and evidence-backed explanations.",
    "Benefits from concrete annotation directions, reference sheets, graphic organizers, and checklists.",
    "Low reading and writing stamina can turn independent work into avoidance unless the first step is explicit.",
    "Academic frustration can look like withdrawal, head down, or leaving the task instead of help-seeking."
  ],
  accommodations: [
    "Repeat directions.",
    "Reminders to pause, plan, proceed.",
    "Copy of teacher notes.",
    "Reference sheets, graphic organizers, and checklists.",
    "Extra time, frequent breaks, scheduled breaks, and one-on-one check-ins.",
    "Small group as needed and front-of-room seating."
  ],
  goals: [
    "Annotate a given text for prompt, focus, and supporting detail.",
    "Answer literal comprehension questions about a text such as main idea, setting, or plot.",
    "Write a claim that accurately answers each part of the question.",
    "Find effective textual evidence to support a claim and explain how evidence contributes to reasoning.",
    "Use coping or help-seeking strategies before shutdown or withdrawal."
  ],
  evidence: [
    {
      id: "iep-profile-impact",
      source: "IEP",
      quote:
        "The learner's disability affects attention, task initiation, focus, stamina, and study skills during classroom learning."
    },
    {
      id: "iep-reading-level",
      source: "IEP",
      quote:
        "The learner reads below grade level; informational text comprehension is a documented area of high need."
    },
    {
      id: "iep-comprehension-stamina",
      source: "IEP",
      quote:
        "The learner struggles to provide accurate answers and has low reading and writing stamina during independent work."
    },
    {
      id: "iep-accommodations",
      source: "IEP",
      quote:
        "Repeat directions; reminders to pause, plan, proceed; graphic organizers and checklists; frequent breaks; one-on-one check-ins."
    },
    {
      id: "iep-ela-goal",
      source: "IEP",
      quote:
        "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
    },
    {
      id: "iep-positive-praise",
      source: "IEP",
      quote: "The learner is motivated by specific positive praise and enjoys being able to talk with peers."
    },
    {
      id: "iep-withdrawal-pattern",
      source: "IEP",
      quote:
        "Academic frustration can lead to avoidance behaviors; the learner may disengage or put their head down."
    }
  ]
};

export const studentProfile = learnerProfile;

export const lessonChunks: LessonChunk[] = [
  {
    id: "lesson-overview",
    phase: "overview",
    title: "What is community and why is it important?",
    minutes: 45,
    teacherMove:
      "Introduce a grade 7 informational text that defines community as an identity-forming shared narrative.",
    studentTask:
      "Determine and summarize the central idea and identify supporting details. Standard focus: RI.7.2.",
    evidence: [
      {
        id: "lesson-skill-focus",
        source: "Lesson",
        quote:
          "Students practice determining and summarizing the central idea of a text and identifying the details that develop it."
      },
      {
        id: "lesson-purpose",
        source: "Lesson",
        quote:
          "Understand what a community is so students can reason about belonging, rejection, and shared narratives."
      }
    ]
  },
  {
    id: "lesson-vocabulary",
    phase: "before-reading",
    title: "Vocabulary and purpose for reading",
    minutes: 5,
    teacherMove: "Preview the purpose and pronounce aspect, moral, narrative, and specific.",
    studentTask: "Use unit vocabulary while tracking the definition of community.",
    evidence: [
      {
        id: "lesson-vocab",
        source: "Lesson",
        quote: "Vocabulary: aspect, moral, narrative, specific."
      }
    ]
  },
  {
    id: "lesson-paragraphs-1-2",
    phase: "during-reading",
    title: "Paragraphs 1-2: claim and criteria",
    minutes: 5,
    teacherMove:
      "Whole-class read and ask students what claim Lowe makes and what traits a definition of community must explain.",
    studentTask: "Summarize at least three key traits of community from the bulleted list.",
    evidence: [
      {
        id: "lesson-p1p2-claim",
        source: "Lesson",
        quote: "What claim does Lowe make about the word community in paragraph 1?"
      },
      {
        id: "lesson-p1p2-summary",
        source: "Lesson",
        quote: "Based on the bulleted list, summarize at least three key traits of a community."
      }
    ]
  },
  {
    id: "lesson-paragraphs-3-7",
    phase: "during-reading",
    title: "Paragraphs 3-7: Newcastle example",
    minutes: 5,
    teacherMove: "Partner read Lowe's definition and example of Newcastle as a community.",
    studentTask:
      "Explain how the example supports the definition, then connect to a community the student knows.",
    evidence: [
      {
        id: "lesson-definition",
        source: "Lesson",
        quote: "A community is a group of people who share an identity-forming narrative."
      },
      {
        id: "lesson-newcastle-question",
        source: "Lesson",
        quote: "How does Lowe's example of belonging to the Newcastle community support his definition?"
      }
    ]
  },
  {
    id: "lesson-paragraphs-8-11",
    phase: "during-reading",
    title: "Paragraphs 8-11: test the definition",
    minutes: 5,
    teacherMove: "Whole-class read and identify why the shared-story definition works.",
    studentTask: "Find evidence answering what community is and why it matters.",
    evidence: [
      {
        id: "lesson-find-evidence",
        source: "Lesson",
        quote: "Highlight two pieces of evidence that answer both questions."
      },
      {
        id: "lesson-social-change",
        source: "Lesson",
        quote: "Social change requires that we rewrite our communal narratives."
      }
    ]
  },
  {
    id: "lesson-independent-practice",
    phase: "independent-practice",
    title: "Independent practice",
    minutes: 20,
    teacherMove:
      "Students answer multiple-choice questions and a short response about the central idea.",
    studentTask:
      "Explain what Lowe means by community as an identity-forming narrative, using relevant unit vocabulary and at least two details.",
    evidence: [
      {
        id: "lesson-short-response",
        source: "Lesson",
        quote:
          "Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative."
      },
      {
        id: "lesson-self-checklist",
        source: "Lesson",
        quote:
          "Did I fully answer the prompt, include at least two details from the text, and incorporate relevant unit vocabulary?"
      }
    ]
  },
  {
    id: "lesson-discussion",
    phase: "discussion",
    title: "Student-led discussion",
    minutes: 5,
    teacherMove:
      "Students discuss personal communities, conformity, and benefits of belonging to more than one community.",
    studentTask: "Record own and partner answers.",
    evidence: [
      {
        id: "lesson-discussion-community",
        source: "Lesson",
        quote:
          "Consider a community you are part of. What is something that is considered courteous behavior in that community?"
      }
    ]
  }
];

export const udlEvidence: EvidenceRef[] = [
  {
    id: "udl-representation",
    source: "UDL",
    quote:
      "Representation: offer information in more than one way so learners can perceive, decode, and connect the core idea."
  },
  {
    id: "udl-engagement",
    source: "UDL",
    quote:
      "Engagement: recruit interest, sustain effort, and reduce avoidable threat when persistence is the barrier."
  },
  {
    id: "udl-action-expression",
    source: "UDL",
    quote:
      "Action and expression: provide options for planning, composing, and showing understanding without changing the learning goal."
  }
];

export function evidenceById(id: string): EvidenceRef | undefined {
  return [...learnerProfile.evidence, ...lessonChunks.flatMap((chunk) => chunk.evidence), ...udlEvidence].find(
    (entry) => entry.id === id
  );
}
