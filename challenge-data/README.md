# Challenge Data Provenance

This repo does not re-host the original challenge lesson or IEP files.

Public examples use pseudonymized, reduced excerpts derived only for the Waypoint challenge submission. The source challenge asks participants not to redistribute the materials outside the challenge context, so the implementation keeps the useful planning structure without turning the repo into a document mirror.

## What Is Included

- A pseudonymized learner case label: `Learner 7A`.
- Reduced planning facts in `src/knowledge.ts`, organized as typed IEP, lesson, and UDL evidence refs.
- Generated examples in `examples/` that show the packet shape, compact payload, evidence audit, handout, and quality report.
- Generated showcase data in `showcase/src/generated-data.js`, produced from the same packet builder as the examples.

## What Is Not Included

- The original learner name.
- The original full IEP or lesson documents.
- A copied challenge packet, PDF mirror, or raw source-document dump.

## Why This Shape

Reviewers can still audit the important claims: every recommendation points to evidence IDs, every evidence ID has a source type, and the generated artifacts preserve the grade-level `RI.7.2` task. The private source packet stays private; the repo carries only the reduced planning context needed to inspect the MCP design and output quality.
