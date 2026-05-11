# Reviewer Workflow: Compact First, Receipts On Demand

A reviewer can see the whole MCP shape without asking the client to swallow the whole packet first.

## 1. Start Small

`generate_teacher_packet({ minutesAvailable: 15, emphasis: "balanced", detail: "compact" })`

- Compact payload: 3,829 characters
- Full packet payload: 16,734 characters
- Default call is 23% of the full packet, under the 30% payload budget enforced by tests.
- It keeps recommendation IDs, short actions, material IDs, and next-tool hints intact.
- Quality status: passed

Use-first recommendations:
- Use the two-symbol annotation key during paragraphs 1-2.
- Do the 45-second first-step check-in before independent practice.
- Keep the original short-response prompt, but add the claim-evidence-explain frame.

## 2. Pull One Receipt

`explain_modification({ modificationId: "mod-short-response-frame" })`

Recommendation: Independent short response
Teacher action: Keep the same prompt and evidence expectation, but provide a claim-evidence-explain frame and allow oral rehearsal before writing.

Receipt:
- IEP quote: The learner will answer literal comprehension questions, write a claim, find textual evidence, and explain how evidence supports reasoning.
- Lesson demand: Explain what Lowe means when he says a community is a group of people who share an identity-forming narrative.
- UDL: action-expression (Support executive functions and composition.)
- Barrier: The learner can know the answer but run out of writing stamina before claim, evidence, and explanation all appear.
- Standard preserved: RI.7.2
- Progress check: Accept a rehearsed oral claim first, then require the written frame with two text details.

## 3. Scan The Rail

`render_evidence_audit({ minutesAvailable: 15, emphasis: "balanced" })`

- Default audit summary: 902 characters
- Full quote table: 2,479 characters
- Summary call is 36% of the full audit and keeps every evidence ref visible.
- Use `render_evidence_audit({ detail: "full" })` only when a reviewer wants the quote table.

## 4. Run The Gate

`review_packet_quality({ minutesAvailable: 15, emphasis: "balanced" })`

Detector: No Hand-Wavy Accommodations Detector
Result: All recommendations are specific, evidence-grounded, RI.7.2-preserving, and safe to put in front of a student.

That is the intended MCP rhythm: compact packet first, one receipt when a recommendation earns inspection, compact audit when the whole rail needs scanning, full handout only when the client is ready to present it.
