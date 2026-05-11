export const data = {
  "title": "Waypoint Differentiation Lab",
  "thesis": "Turn one lesson map and one learner profile into tomorrow's evidence-grounded supports.",
  "packet": {
    "caseLabel": "Learner 7A",
    "teacherMode": "Tomorrow Mode",
    "evidenceSystem": "Receipts Rail",
    "qualityCheck": "No Hand-Wavy Accommodations Detector",
    "preservedStandard": "RI.7.2",
    "lessonSnapshot": "The lesson asks seventh graders to determine and summarize the central idea of Toby Lowe's informational text: community is a shared, identity-forming narrative. The key deliverable is a short response using unit vocabulary and at least two text details.",
    "useFirst": [
      "Use the two-symbol annotation key during paragraphs 1-2.",
      "Do the 45-second first-step check-in before independent practice.",
      "Keep the original short-response prompt, but add the claim-evidence-explain frame."
    ],
    "qualityReport": {
      "name": "No Hand-Wavy Accommodations Detector",
      "passed": true,
      "checks": {
        "vagueAdvice": true,
        "loweredRigor": true,
        "missingEvidence": true,
        "unsafeStudentLanguage": true,
        "materialsMatchRecommendations": true
      },
      "flags": [],
      "summary": "All recommendations are specific, evidence-grounded, RI.7.2-preserving, and safe to put in front of a student."
    }
  },
  "mcpStats": {
    "compactChars": 6232,
    "fullChars": 28299,
    "compactPercentOfFull": 22,
    "savedPercent": 78,
    "defaultTool": "generate_teacher_packet detail=compact",
    "onDemandTool": "explain_modification",
    "catalogBudget": {
      "tool": "tool catalog",
      "mode": "startup",
      "budget": 5000,
      "textChannel": "concise tool list",
      "structuredContent": "shallow passthrough schemas"
    },
    "resourceBudgets": [
      {
        "tool": "learner-profile summary resource",
        "mode": "resource",
        "budget": 900,
        "textChannel": "planning gist",
        "structuredContent": "full profile resource"
      },
      {
        "tool": "lesson-map summary resource",
        "mode": "resource",
        "budget": 1400,
        "textChannel": "chunk index",
        "structuredContent": "full lesson resource"
      }
    ],
    "textBudgets": [
      {
        "tool": "generate_teacher_packet",
        "mode": "compact",
        "budget": 1200,
        "textChannel": "brief handoff",
        "structuredContent": "compact packet"
      },
      {
        "tool": "get_learner_profile",
        "mode": "summary",
        "budget": 520,
        "textChannel": "planning gist",
        "structuredContent": "profile object"
      },
      {
        "tool": "get_lesson_map",
        "mode": "summary",
        "budget": 900,
        "textChannel": "phase list",
        "structuredContent": "lesson chunks"
      },
      {
        "tool": "explain_modification",
        "mode": "receipt",
        "budget": 850,
        "textChannel": "short receipt",
        "structuredContent": "quote trace"
      },
      {
        "tool": "review_packet_quality",
        "mode": "summary",
        "budget": 480,
        "textChannel": "verdict",
        "structuredContent": "check flags"
      },
      {
        "tool": "explain_evidence",
        "mode": "lookup",
        "budget": 320,
        "textChannel": "single receipt ref",
        "structuredContent": "typed evidence"
      },
      {
        "tool": "render_evidence_audit",
        "mode": "summary",
        "budget": 1100,
        "textChannel": "ref index",
        "structuredContent": "audit selector"
      }
    ]
  },
  "modifications": [
    {
      "id": "mod-preview-vocab",
      "lessonMoment": "Before reading: purpose and vocabulary",
      "category": "access",
      "supportType": "access",
      "teacherAction": "Give Learner 7A a four-word preview card. For each word, say it, show a student-friendly meaning, and ask them to choose the matching example before the full text starts.",
      "studentFacingText": "Today these words do work: aspect = one part, moral = about right and wrong, narrative = story, specific = exact. Put a check next to the word you expect to see in the definition of community.",
      "rationale": "The lesson requires unit vocabulary in the RI.7.2 written response. Pre-teaching reduces decoding and meaning load before the learner meets the grade-level informational text.",
      "timeCost": "2 minutes before reading",
      "evidenceTrace": {
        "modificationId": "mod-preview-vocab",
        "iep": {
          "id": "iep-reading-level",
          "source": "IEP",
          "quote": "The learner reads below grade level; informational text comprehension is a documented area of high need."
        },
        "lesson": {
          "id": "lesson-vocab",
          "source": "Lesson",
          "quote": "Vocabulary: aspect, moral, narrative, specific."
        },
        "udl": {
          "id": "udl-representation",
          "source": "UDL",
          "quote": "Representation: offer information in more than one way so learners can perceive, decode, and connect the core idea."
        },
        "iepQuote": "The learner reads below grade level; informational text comprehension is a documented area of high need.",
        "lessonDemand": "Vocabulary: aspect, moral, narrative, specific.",
        "udlAlignment": [
          {
            "principle": "representation",
            "checkpoint": "Clarify vocabulary and symbols.",
            "why": "The core lesson stays intact while key words become usable before reading."
          }
        ],
        "barrierAddressed": "Vocabulary load can block access to the central idea before the RI.7.2 work even begins.",
        "supportType": "access",
        "standardPreserved": "RI.7.2",
        "progressCheck": "Ask the learner to point to the word that means story before paragraph 3."
      }
    },
    {
      "id": "mod-annotation-code",
      "lessonMoment": "Paragraphs 1-2: claim and criteria",
      "category": "modified-material",
      "supportType": "material",
      "teacherAction": "Replace open annotation with a two-symbol code: box Lowe's claim and star three traits a definition of community must explain.",
      "studentFacingText": "Box the sentence that tells Lowe's big claim. Star three bullets that tell what a community definition must explain.",
      "rationale": "This preserves the RI.7.2 central-idea work while making annotation concrete enough for a learner whose goal includes prompt-focused annotation.",
      "timeCost": "No extra time; use during the first whole-class pause",
      "evidenceTrace": {
        "modificationId": "mod-annotation-code",
        "iep": {
          "id": "iep-ela-goal",
          "source": "IEP",
          "quote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
        },
        "lesson": {
          "id": "lesson-p1p2-claim",
          "source": "Lesson",
          "quote": "What claim does Lowe make about the word community in paragraph 1?"
        },
        "udl": {
          "id": "udl-representation",
          "source": "UDL",
          "quote": "Representation: offer information in more than one way so learners can perceive, decode, and connect the core idea."
        },
        "iepQuote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.",
        "lessonDemand": "What claim does Lowe make about the word community in paragraph 1?",
        "udlAlignment": [
          {
            "principle": "representation",
            "checkpoint": "Highlight patterns, critical features, big ideas, and relationships.",
            "why": "The box/star code makes the central idea and supporting details visually separable."
          },
          {
            "principle": "action-expression",
            "checkpoint": "Use tools for construction and composition.",
            "why": "The learner can mark the grade-level text without inventing an annotation system."
          }
        ],
        "barrierAddressed": "Open-ended annotation creates too many choices, so the learner may not capture the claim or details.",
        "supportType": "material",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner can show one boxed claim and three starred traits before answering the summary question."
      }
    },
    {
      "id": "mod-scaffold-p1p2",
      "lessonMoment": "During reading question C for paragraphs 1-2",
      "category": "scaffolded-question",
      "supportType": "scaffold",
      "teacherAction": "Ask the original question, then offer a response frame and selectable traits if Learner 7A stalls for more than 10 seconds.",
      "studentFacingText": "A community can be different from a regular group because ____. A community can make people feel ____. A community can shape what people think is ____ or ____.",
      "rationale": "The scaffold keeps the same RI.7.2 comprehension target but moves the learner from blank-page recall to recognition plus completion.",
      "timeCost": "30 seconds at the pause point",
      "evidenceTrace": {
        "modificationId": "mod-scaffold-p1p2",
        "iep": {
          "id": "iep-reading-level",
          "source": "IEP",
          "quote": "The learner reads below grade level; informational text comprehension is a documented area of high need."
        },
        "lesson": {
          "id": "lesson-p1p2-summary",
          "source": "Lesson",
          "quote": "Based on the bulleted list, summarize at least three key traits of a community."
        },
        "udl": {
          "id": "udl-action-expression",
          "source": "UDL",
          "quote": "Action and expression: provide options for planning, composing, and showing understanding without changing the learning goal."
        },
        "iepQuote": "The learner reads below grade level; informational text comprehension is a documented area of high need.",
        "lessonDemand": "Based on the bulleted list, summarize at least three key traits of a community.",
        "udlAlignment": [
          {
            "principle": "action-expression",
            "checkpoint": "Support planning and strategy development.",
            "why": "A frame gives the learner a path for showing the same central-idea understanding."
          }
        ],
        "barrierAddressed": "Independent recall is the bottleneck, not the target skill of identifying key traits.",
        "supportType": "scaffold",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner names at least three traits from paragraph 2, orally or in writing."
      }
    },
    {
      "id": "mod-newcastle-bridge",
      "lessonMoment": "Paragraphs 3-7: Newcastle example",
      "category": "scaffolded-question",
      "supportType": "scaffold",
      "teacherAction": "Use a two-column bridge chart: left side 'Newcastle detail from text,' right side 'How it proves shared story.' Complete the first row together.",
      "studentFacingText": "Text detail: Lowe supports Newcastle United. This proves shared story because people in that community act out the same story together.",
      "rationale": "The original RI.7.2 task asks how an example supports a definition. The chart makes the evidence-to-idea relationship visible without changing the prompt.",
      "timeCost": "2 minutes during partner reading",
      "evidenceTrace": {
        "modificationId": "mod-newcastle-bridge",
        "iep": {
          "id": "iep-ela-goal",
          "source": "IEP",
          "quote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
        },
        "lesson": {
          "id": "lesson-definition",
          "source": "Lesson",
          "quote": "A community is a group of people who share an identity-forming narrative."
        },
        "udl": {
          "id": "udl-representation",
          "source": "UDL",
          "quote": "Representation: offer information in more than one way so learners can perceive, decode, and connect the core idea."
        },
        "iepQuote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.",
        "lessonDemand": "A community is a group of people who share an identity-forming narrative.",
        "udlAlignment": [
          {
            "principle": "representation",
            "checkpoint": "Illustrate through multiple media.",
            "why": "The chart turns an abstract definition-support relationship into a visible bridge."
          },
          {
            "principle": "action-expression",
            "checkpoint": "Build fluencies with graduated levels of support.",
            "why": "The first row is modeled, then the learner completes the same kind of reasoning."
          }
        ],
        "barrierAddressed": "The learner may find a detail but lose the reasoning step that connects evidence to the definition.",
        "supportType": "scaffold",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner adds one more Newcastle detail and explains it with the phrase 'This proves... because...'."
      }
    },
    {
      "id": "mod-evidence-sorter",
      "lessonMoment": "Paragraphs 8-11: why the definition matters",
      "category": "modified-material",
      "supportType": "material",
      "teacherAction": "Give a two-column evidence sorter labeled 'What community is' and 'Why community matters.' Learner 7A places two highlighted details before writing.",
      "studentFacingText": "Put each detail where it fits: What community is, or Why community matters. Then choose one detail from each column for your answer.",
      "rationale": "The lesson asks students to highlight evidence answering both questions. The sorter protects the RI.7.2 evidence-selection demand from becoming a memory pile.",
      "timeCost": "2 minutes during the paragraph 8-11 pause",
      "evidenceTrace": {
        "modificationId": "mod-evidence-sorter",
        "iep": {
          "id": "iep-ela-goal",
          "source": "IEP",
          "quote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
        },
        "lesson": {
          "id": "lesson-find-evidence",
          "source": "Lesson",
          "quote": "Highlight two pieces of evidence that answer both questions."
        },
        "udl": {
          "id": "udl-representation",
          "source": "UDL",
          "quote": "Representation: offer information in more than one way so learners can perceive, decode, and connect the core idea."
        },
        "iepQuote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.",
        "lessonDemand": "Highlight two pieces of evidence that answer both questions.",
        "udlAlignment": [
          {
            "principle": "representation",
            "checkpoint": "Guide information processing and visualization.",
            "why": "Sorting details by purpose makes the RI.7.2 evidence structure explicit."
          },
          {
            "principle": "action-expression",
            "checkpoint": "Use graphic organizers for composing and problem solving.",
            "why": "The organizer becomes a bridge from highlighting to a written response."
          }
        ],
        "barrierAddressed": "The task requires sorting two kinds of evidence, which can overwhelm working memory during reading.",
        "supportType": "material",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner places one accurate detail in each column and explains why one belongs there."
      }
    },
    {
      "id": "mod-checkin-before-independent",
      "lessonMoment": "Transition into independent practice",
      "category": "accommodation-reminder",
      "supportType": "engagement",
      "teacherAction": "Before independent work, do a quiet one-on-one check-in: repeat directions, point to the checklist, and agree on a first step. Use specific positive praise for starting.",
      "studentFacingText": "First step: answer question 2 by finding the sentence that best states the central idea. I will check back after question 2.",
      "rationale": "This uses documented supports and interrupts the withdrawal pattern before independent grade-level RI.7.2 reading becomes a shutdown trigger.",
      "timeCost": "45 seconds before independent work",
      "evidenceTrace": {
        "modificationId": "mod-checkin-before-independent",
        "iep": {
          "id": "iep-accommodations",
          "source": "IEP",
          "quote": "Repeat directions; reminders to pause, plan, proceed; graphic organizers and checklists; frequent breaks; one-on-one check-ins."
        },
        "lesson": {
          "id": "lesson-short-response",
          "source": "Lesson",
          "quote": "Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative."
        },
        "udl": {
          "id": "udl-engagement",
          "source": "UDL",
          "quote": "Engagement: recruit interest, sustain effort, and reduce avoidable threat when persistence is the barrier."
        },
        "iepQuote": "Repeat directions; reminders to pause, plan, proceed; graphic organizers and checklists; frequent breaks; one-on-one check-ins.",
        "lessonDemand": "Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative.",
        "udlAlignment": [
          {
            "principle": "engagement",
            "checkpoint": "Sustain effort and persistence.",
            "why": "A first-step agreement makes the independent task feel startable and gives the teacher a quick return point."
          }
        ],
        "barrierAddressed": "Task initiation and stamina can collapse at the exact point the lesson shifts to independent work.",
        "supportType": "engagement",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner can state the first step and begin it within one minute."
      }
    },
    {
      "id": "mod-short-response-frame",
      "lessonMoment": "Independent short response",
      "category": "alternative-assessment",
      "supportType": "assessment",
      "teacherAction": "Keep the same prompt and evidence expectation, but provide a claim-evidence-explain frame and allow oral rehearsal before writing.",
      "studentFacingText": "Claim: Lowe means a community is ____. Evidence 1: In paragraph __, he says ____. This shows ____. Evidence 2: In paragraph __, he says ____. This shows ____.",
      "rationale": "The lesson asks for a written explanation with two details. The learner's goals name claim writing, evidence selection, and stamina, so the frame supports RI.7.2 access without lowering the target.",
      "timeCost": "3 minutes setup; saves time during writing",
      "evidenceTrace": {
        "modificationId": "mod-short-response-frame",
        "iep": {
          "id": "iep-ela-goal",
          "source": "IEP",
          "quote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
        },
        "lesson": {
          "id": "lesson-short-response",
          "source": "Lesson",
          "quote": "Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative."
        },
        "udl": {
          "id": "udl-action-expression",
          "source": "UDL",
          "quote": "Action and expression: provide options for planning, composing, and showing understanding without changing the learning goal."
        },
        "iepQuote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.",
        "lessonDemand": "Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative.",
        "udlAlignment": [
          {
            "principle": "action-expression",
            "checkpoint": "Support executive functions and composition.",
            "why": "Oral rehearsal plus a frame preserves the two-detail written response while reducing planning load."
          }
        ],
        "barrierAddressed": "The learner can know the answer but run out of writing stamina before claim, evidence, and explanation all appear.",
        "supportType": "assessment",
        "standardPreserved": "RI.7.2",
        "progressCheck": "Accept a rehearsed oral claim first, then require the written frame with two text details."
      }
    },
    {
      "id": "mod-discussion-role",
      "lessonMoment": "Student-led discussion",
      "category": "access",
      "supportType": "engagement",
      "teacherAction": "Give Learner 7A a defined peer role: evidence finder. They read one highlighted line from the text before sharing a personal-community answer.",
      "studentFacingText": "My evidence from Lowe is: ____. My community example is: ____. These connect because ____.",
      "rationale": "Peer talk and helping roles are motivating. The role turns discussion into structured RI.7.2 participation instead of an unbounded social task.",
      "timeCost": "No extra time",
      "evidenceTrace": {
        "modificationId": "mod-discussion-role",
        "iep": {
          "id": "iep-positive-praise",
          "source": "IEP",
          "quote": "The learner is motivated by specific positive praise and enjoys being able to talk with peers."
        },
        "lesson": {
          "id": "lesson-discussion-community",
          "source": "Lesson",
          "quote": "Consider a community you are part of. What is something that is considered courteous behavior in that community?"
        },
        "udl": {
          "id": "udl-engagement",
          "source": "UDL",
          "quote": "Engagement: recruit interest, sustain effort, and reduce avoidable threat when persistence is the barrier."
        },
        "iepQuote": "The learner is motivated by specific positive praise and enjoys being able to talk with peers.",
        "lessonDemand": "Consider a community you are part of. What is something that is considered courteous behavior in that community?",
        "udlAlignment": [
          {
            "principle": "engagement",
            "checkpoint": "Optimize relevance, value, and authenticity.",
            "why": "The role gives the learner a reason to participate with the text, not just around it."
          },
          {
            "principle": "action-expression",
            "checkpoint": "Use multiple media for communication.",
            "why": "The learner can first read evidence aloud, then connect it in their own words."
          }
        ],
        "barrierAddressed": "Discussion can become too open-ended, even though the learner is motivated by peer talk.",
        "supportType": "engagement",
        "standardPreserved": "RI.7.2",
        "progressCheck": "The learner contributes once using text evidence and once using a personal example."
      }
    },
    {
      "id": "mod-progress-monitor",
      "lessonMoment": "End of lesson",
      "category": "progress-monitoring",
      "supportType": "monitoring",
      "teacherAction": "Record three quick data points: annotation completed, literal central-idea answer correct, claim frame started. This doubles as progress evidence without a second form.",
      "studentFacingText": "Exit check: 1. My boxed claim is ____. 2. One detail that supports it is ____. 3. Today I used this strategy: annotate / reread / ask for help.",
      "rationale": "The packet should help the teacher teach tomorrow and collect progress evidence for the same RI.7.2 comprehension and evidence goals.",
      "timeCost": "1 minute",
      "evidenceTrace": {
        "modificationId": "mod-progress-monitor",
        "iep": {
          "id": "iep-ela-goal",
          "source": "IEP",
          "quote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning."
        },
        "lesson": {
          "id": "lesson-skill-focus",
          "source": "Lesson",
          "quote": "Students practice determining and summarizing the central idea of a text and identifying the details that develop it."
        },
        "udl": {
          "id": "udl-engagement",
          "source": "UDL",
          "quote": "Engagement: recruit interest, sustain effort, and reduce avoidable threat when persistence is the barrier."
        },
        "iepQuote": "The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.",
        "lessonDemand": "Students practice determining and summarizing the central idea of a text and identifying the details that develop it.",
        "udlAlignment": [
          {
            "principle": "engagement",
            "checkpoint": "Develop self-assessment and reflection.",
            "why": "The exit check asks the learner to name the strategy used during the same lesson."
          },
          {
            "principle": "action-expression",
            "checkpoint": "Monitor progress.",
            "why": "The teacher gets observable evidence tied to annotation, literal comprehension, and claim writing."
          }
        ],
        "barrierAddressed": "Teachers need quick progress data, but extra paperwork after class is where good intentions go to take a nap.",
        "supportType": "monitoring",
        "standardPreserved": "RI.7.2",
        "progressCheck": "Teacher marks yes or not yet for each of the three data points."
      }
    }
  ],
  "miniMaterials": [
    {
      "id": "mat-vocab-preview",
      "name": "Four-word preview card",
      "appliesTo": [
        "mod-preview-vocab"
      ],
      "content": [
        "aspect = one part",
        "moral = about right and wrong",
        "narrative = story",
        "specific = exact",
        "Circle one word you expect to see in a definition of community."
      ]
    },
    {
      "id": "mat-annotation-key",
      "name": "Two-symbol annotation key",
      "appliesTo": [
        "mod-annotation-code"
      ],
      "content": [
        "Box = Lowe's claim or definition.",
        "Star = detail that explains what makes a community different from a regular group."
      ]
    },
    {
      "id": "mat-traits-frame",
      "name": "Paragraph 2 trait frame",
      "appliesTo": [
        "mod-scaffold-p1p2"
      ],
      "content": [
        "A community can be different from a regular group because ____.",
        "A community can make people feel ____.",
        "A community can shape what people think is ____ or ____."
      ]
    },
    {
      "id": "mat-newcastle-bridge",
      "name": "Newcastle bridge chart",
      "appliesTo": [
        "mod-newcastle-bridge"
      ],
      "content": [
        "Text detail: Lowe supports Newcastle United. How it proves shared story: people in the community act out the same story together.",
        "Text detail: ________. How it proves shared story: ________."
      ]
    },
    {
      "id": "mat-evidence-sorter",
      "name": "Paragraph 8-11 evidence sorter",
      "appliesTo": [
        "mod-evidence-sorter"
      ],
      "content": [
        "What community is: ________",
        "Why community matters: ________",
        "Best detail for my answer: ________"
      ]
    },
    {
      "id": "mat-first-step-card",
      "name": "First-step check-in card",
      "appliesTo": [
        "mod-checkin-before-independent"
      ],
      "content": [
        "First step: answer question 2 by finding the sentence that best states the central idea.",
        "Check-back point: after question 2."
      ]
    },
    {
      "id": "mat-short-response-frame",
      "name": "Short-response frame",
      "appliesTo": [
        "mod-short-response-frame"
      ],
      "content": [
        "Claim: Lowe means a community is ________.",
        "Evidence 1: In paragraph __, he says ________.",
        "This shows ________.",
        "Evidence 2: In paragraph __, he says ________.",
        "This shows ________."
      ]
    },
    {
      "id": "mat-discussion-role",
      "name": "Evidence finder discussion role",
      "appliesTo": [
        "mod-discussion-role"
      ],
      "content": [
        "My evidence from Lowe is: ________.",
        "My community example is: ________.",
        "These connect because ________."
      ]
    },
    {
      "id": "mat-exit-check",
      "name": "Three-point exit check",
      "appliesTo": [
        "mod-progress-monitor"
      ],
      "content": [
        "Boxed claim present: yes / not yet",
        "One literal central-idea answer correct: yes / not yet",
        "Claim frame started with evidence: yes / not yet",
        "Strategy used today: annotate / reread / ask for help / check-in"
      ]
    }
  ],
  "architecture": [
    "Resources: learner profile and lesson map",
    "Tools: generate packet, explain modification, review quality",
    "Generator: deterministic TypeScript rules with typed evidence traces",
    "Presentation: Claude or any MCP client turns the packet into teacher-ready prose"
  ]
};
