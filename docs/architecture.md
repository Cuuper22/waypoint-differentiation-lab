# Architecture

Waypoint Differentiation Lab is intentionally small: structured classroom context in, auditable teacher packet out.

## Data model

`src/knowledge.ts` holds two resources:

- `learnerProfile`: pseudonymized IEP-derived planning context for Learner 7A.
- `lessonChunks`: the lesson split into teachable moments with evidence IDs.

`src/types.ts` and `src/schemas.ts` define packet, modification, evidence trace, quality report, and handout-section contracts.

## Generator

`src/generator.ts` is deterministic. Each modification starts as a typed draft with:

- IEP refs
- lesson refs
- UDL refs
- support type
- barrier addressed
- material IDs
- check for understanding

The builder resolves those refs into an `EvidenceTrace` before a packet can be returned. No vector search is needed for this challenge case; a small, inspectable ruleset is easier to trust.

## MCP surface

Resources expose the profile, lesson map, packet JSON, and handout Markdown.

Tools expose the operations a teacher-facing client needs:

- `generate_teacher_packet`
- `explain_modification`
- `review_packet_quality`
- `get_student_profile`
- `get_lesson_map`
- `explain_evidence`
- `render_evidence_audit`

The prompt `differentiate_community_lesson` tells the client to call the generator, inspect receipts, and keep adult-facing labels out of student-facing text.

## Quality gate

`review_packet_quality` flags:

- vague advice
- missing IEP, lesson, or UDL evidence
- lowered rigor
- unsafe student-facing language
- missing progress checks
- material IDs that do not appear in the packet

The test suite covers the same claims so the showcase does not outrun the implementation.

## Showcase

`showcase/` is a Vite app fed by `showcase/src/generated-data.js`, which `npm run demo` writes from the same packet builder. The visual walkthrough is not a separate story pasted on top of the code; it is a product-shaped view of the same packet and evidence traces.
