# Architecture

Waypoint Differentiation Lab is intentionally small: structured classroom context in, compact packet out, deep receipts on demand.

## Data model

`src/knowledge.ts` holds two resources:

- `learnerProfile`: pseudonymized IEP-derived planning context for Learner 7A.
- `lessonChunks`: the lesson split into teachable moments with evidence IDs.

`src/types.ts` and `src/schemas.ts` define source-resource, packet, modification, evidence trace, quality report, and handout-section contracts. Tests parse both the input resources and generated outputs through those public schemas.

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

The default MCP structured output is compact: recommendation IDs, short teacher actions, material IDs, evidence IDs, quality status, and next tool hints. The text channel is intentionally brief so clients do not pay twice for the same data; `src/mcp-budgets.ts` feeds both the stdio smoke test and the showcase budget panel for every public text-returning tool and compact summary resource. The same smoke test also caps the tool catalog itself, so startup metadata stays lean. Quote-level traces remain available through `explain_modification`, and the full audit table remains available through `render_evidence_audit({ detail: "full" })`, so clients do not spend context on receipts they never inspect.

## MCP surface

Resources expose compact profile and lesson summaries first, then the full profile, lesson map, packet JSON, and handout Markdown.

Tools expose the operations a teacher-facing client needs:

- `generate_teacher_packet`
- `explain_modification`
- `review_packet_quality`
- `get_learner_profile`
- `get_lesson_map`
- `explain_evidence`
- `render_evidence_audit`

Every public tool advertises a non-empty object output schema. Those schemas are shallow passthrough contracts rather than giant nested packet replicas: the client gets route-level validation, while `structuredContent` can still carry the rich packet, audits, or a second model pass without inflating the always-visible tool list.

The prompt `differentiate_community_lesson` tells the client to start with compact summary resources, call the generator, inspect receipts, and keep adult-facing labels out of student-facing text.

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

`showcase/` is a Vite app fed by `showcase/src/generated-data.js`, which `npm run demo` writes from the same packet builder. The visual walkthrough uses generated cinematic frames for the reviewer story, but the recommendations, quality checks, payload meter, reviewer path, and receipt details come from the same packet and evidence traces.

`npm run submission:check` runs the build, tests, artifact generation, Vite build, MCP stdio smoke test, browser QA, and terminal reviewer workflow. The browser QA script starts the showcase server when needed, so the verification path does not require a second terminal.
