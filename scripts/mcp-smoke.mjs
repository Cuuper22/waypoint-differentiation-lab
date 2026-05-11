import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  mcpManifestBudgets,
  mcpPromptBudgets,
  mcpResourceBudgets,
  mcpStructuredBudgets,
  mcpTextBudgets
} from "../dist/mcp-budgets.js";

const requiredTools = [
  "generate_teacher_packet",
  "explain_modification",
  "review_packet_quality",
  "get_learner_profile",
  "get_lesson_map",
  "explain_evidence",
  "render_evidence_audit"
];

const requiredResources = [
  "waypoint://case/learner-7a/summary",
  "waypoint://case/learner-7a/profile",
  "waypoint://lesson/community/summary",
  "waypoint://lesson/community/map",
  "waypoint://packet/community/learner-7a"
];

const requiredPrompts = ["differentiate_community_lesson"];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/server.js"],
  cwd: process.cwd(),
  stderr: "pipe"
});

const client = new Client({ name: "waypoint-submission-smoke", version: "1.0.0" });

try {
  await client.connect(transport);

  const tools = await client.listTools();
  const toolNames = new Set(tools.tools.map((tool) => tool.name));
  const toolsByName = new Map(tools.tools.map((tool) => [tool.name, tool]));
  const manifestMetrics = measureToolManifest(tools.tools);
  assert(
    manifestMetrics.totalChars <= mcpManifestBudgets.toolCatalogMaxChars,
    `MCP tool catalog is ${manifestMetrics.totalChars} chars, over ${mcpManifestBudgets.toolCatalogMaxChars}`
  );
  for (const tool of manifestMetrics.tools) {
    assert(
      tool.totalChars <= mcpManifestBudgets.toolManifestMaxChars,
      `${tool.name} tool manifest is ${tool.totalChars} chars, over ${mcpManifestBudgets.toolManifestMaxChars}`
    );
    assert(
      tool.outputSchemaChars <= mcpManifestBudgets.outputSchemaMaxChars,
      `${tool.name} output schema is ${tool.outputSchemaChars} chars, over ${mcpManifestBudgets.outputSchemaMaxChars}`
    );
    assert(
      tool.descriptionChars <= mcpManifestBudgets.descriptionMaxChars,
      `${tool.name} description is ${tool.descriptionChars} chars, over ${mcpManifestBudgets.descriptionMaxChars}`
    );
  }
  for (const tool of requiredTools) {
    assert(toolNames.has(tool), `Missing MCP tool: ${tool}`);
    assert(toolsByName.get(tool)?.outputSchema?.type === "object", `Missing output schema for MCP tool: ${tool}`);
    assert(
      Object.keys(toolsByName.get(tool)?.outputSchema?.properties ?? {}).length > 0,
      `MCP tool output schema is too loose: ${tool}`
    );
  }

  const resources = await client.listResources();
  const resourceUris = new Set(resources.resources.map((resource) => resource.uri));
  for (const resource of requiredResources) {
    assert(resourceUris.has(resource), `Missing MCP resource: ${resource}`);
  }

  const prompts = await client.listPrompts();
  const promptNames = new Set(prompts.prompts.map((prompt) => prompt.name));
  const promptMetrics = measurePromptManifest(prompts.prompts);
  assert(
    promptMetrics.totalChars <= mcpPromptBudgets.promptCatalogMaxChars,
    `MCP prompt catalog is ${promptMetrics.totalChars} chars, over ${mcpPromptBudgets.promptCatalogMaxChars}`
  );
  for (const prompt of promptMetrics.prompts) {
    assert(
      prompt.totalChars <= mcpPromptBudgets.promptManifestMaxChars,
      `${prompt.name} prompt manifest is ${prompt.totalChars} chars, over ${mcpPromptBudgets.promptManifestMaxChars}`
    );
  }
  for (const prompt of requiredPrompts) {
    assert(promptNames.has(prompt), `Missing MCP prompt: ${prompt}`);
  }

  const handoffPrompt = await client.getPrompt({
    name: "differentiate_community_lesson",
    arguments: { teacherNeed: "Need the 15-minute balanced packet." }
  });
  const handoffPromptText = handoffPrompt.messages
    ?.map((message) => message.content?.text ?? "")
    .join("\n")
    .trim();
  assert(handoffPromptText, "differentiate_community_lesson returned no prompt text");
  assert(
    handoffPromptText.length <= mcpPromptBudgets.promptMessageMaxChars,
    `differentiate_community_lesson prompt text is ${handoffPromptText.length} chars, over ${mcpPromptBudgets.promptMessageMaxChars}`
  );
  assert(handoffPromptText.includes('detail: "compact"'), "handoff prompt lost compact-first instruction");

  const profileSummaryResource = await readTextResource(client, "waypoint://case/learner-7a/summary");
  assert(
    profileSummaryResource.length <= mcpResourceBudgets.learnerProfileSummary,
    `learner-profile summary resource is ${profileSummaryResource.length} chars, over ${mcpResourceBudgets.learnerProfileSummary}`
  );
  assert(profileSummaryResource.includes("Learner 7A"), "learner-profile summary resource lost case label");

  const lessonSummaryResource = await readTextResource(client, "waypoint://lesson/community/summary");
  assert(
    lessonSummaryResource.length <= mcpResourceBudgets.lessonMapSummary,
    `lesson-map summary resource is ${lessonSummaryResource.length} chars, over ${mcpResourceBudgets.lessonMapSummary}`
  );
  assert(lessonSummaryResource.includes("RI.7.2"), "lesson-map summary resource lost preserved standard");

  const packet = await client.callTool({
    name: "generate_teacher_packet",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable", detail: "compact" }
  });
  assertTextBudget(packet, "generate_teacher_packet compact", mcpTextBudgets.generateTeacherPacketCompact);
  assertStructuredBudget(
    packet,
    "generate_teacher_packet compact",
    mcpStructuredBudgets.generateTeacherPacketCompact
  );
  assert(packet.structuredContent?.detail === "compact", "generate_teacher_packet did not return compact structured content");
  assert(packet.structuredContent?.quality?.passed === true, "Compact packet quality did not pass");
  assert(
    packet.structuredContent?.modifications?.every((modification) => modification.standardPreserved === "RI.7.2"),
    "Compact packet did not preserve RI.7.2 on every recommendation"
  );

  const invalidMinutes = await client.callTool({
    name: "generate_teacher_packet",
    arguments: { minutesAvailable: 10, emphasis: "balanced", detail: "compact" }
  });
  assert(invalidMinutes.isError === true, "generate_teacher_packet accepted unsupported prep minutes");
  assert(
    invalidMinutes.content?.some((item) => item.text?.includes("minutesAvailable must be 5, 15, or 45")),
    "generate_teacher_packet unsupported prep minutes did not explain the allowed values"
  );

  const fullPacket = await client.callTool({
    name: "generate_teacher_packet",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable", detail: "full" }
  });
  assert(
    textChars(fullPacket) > textChars(packet),
    "generate_teacher_packet detail=full did not return richer text than compact detail"
  );
  assert(
    fullPacket.structuredContent?.handoutSections?.length > 0,
    "generate_teacher_packet detail=full did not return handout sections"
  );
  assert(
    fullPacket.structuredContent?.modifications?.every((modification) => modification.evidenceTrace?.standardPreserved === "RI.7.2"),
    "generate_teacher_packet detail=full lost full evidence traces"
  );

  const profile = await client.callTool({
    name: "get_learner_profile",
    arguments: { detail: "summary" }
  });
  assertTextBudget(profile, "get_learner_profile summary", mcpTextBudgets.getLearnerProfileSummary);
  assert(profile.structuredContent?.caseLabel === "Learner 7A", "get_learner_profile lost structured case label");

  const lesson = await client.callTool({
    name: "get_lesson_map",
    arguments: { phase: "all", includeEvidence: false }
  });
  assertTextBudget(lesson, "get_lesson_map summary", mcpTextBudgets.getLessonMapSummary);
  assert(lesson.structuredContent?.chunks?.length >= 6, "get_lesson_map lost structured lesson chunks");

  const receipt = await client.callTool({
    name: "explain_modification",
    arguments: { modificationId: "mod-short-response-frame" }
  });
  assertTextBudget(receipt, "explain_modification receipt", mcpTextBudgets.explainModificationReceipt);
  assertStructuredBudget(receipt, "explain_modification receipt", mcpStructuredBudgets.explainModificationReceipt);
  assert(
    receipt.structuredContent?.receipts?.preservedStandard === "RI.7.2",
    "explain_modification did not return a preserved-standard receipt"
  );

  const quality = await client.callTool({
    name: "review_packet_quality",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable" }
  });
  assertTextBudget(quality, "review_packet_quality summary", mcpTextBudgets.reviewPacketQualitySummary);
  assert(quality.structuredContent?.passed === true, "review_packet_quality did not pass the generated packet");

  const evidence = await client.callTool({
    name: "explain_evidence",
    arguments: { id: "iep-ela-goal" }
  });
  assertTextBudget(evidence, "explain_evidence lookup", mcpTextBudgets.explainEvidenceLookup);
  assert(evidence.structuredContent?.source === "IEP", "explain_evidence did not preserve source type");

  const audit = await client.callTool({
    name: "render_evidence_audit",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable" }
  });
  assertTextBudget(audit, "render_evidence_audit summary", mcpTextBudgets.renderEvidenceAuditSummary);
  assertStructuredBudget(audit, "render_evidence_audit summary", mcpStructuredBudgets.renderEvidenceAuditSummary);
  assert(audit.structuredContent?.detail === "summary", "render_evidence_audit default should be summary detail");
  assert(audit.structuredContent?.markdown === undefined, "render_evidence_audit duplicated markdown in structured content");

  const smokeReportPath = writeSmokeReport({
    artifact: "mcp-smoke-report",
    purpose: "Measured stdio MCP contract from the real server entrypoint.",
    result: "passed",
    startup: {
      tools: tools.tools.length,
      resources: resources.resources.length,
      prompts: prompts.prompts.length,
      toolCatalogChars: manifestMetrics.totalChars,
      toolCatalogBudgetChars: mcpManifestBudgets.toolCatalogMaxChars,
      largestToolManifestChars: Math.max(...manifestMetrics.tools.map((tool) => tool.totalChars)),
      largestToolManifestBudgetChars: mcpManifestBudgets.toolManifestMaxChars,
      toolManifests: manifestMetrics.tools
    },
    prompt: {
      catalogChars: promptMetrics.totalChars,
      catalogBudgetChars: mcpPromptBudgets.promptCatalogMaxChars,
      messageChars: handoffPromptText.length,
      messageBudgetChars: mcpPromptBudgets.promptMessageMaxChars,
      manifests: promptMetrics.prompts,
      routeChecks: ["summary resources first", "compact packet first", "receipts on demand"]
    },
    resources: [
      {
        uri: "waypoint://case/learner-7a/summary",
        textChars: profileSummaryResource.length,
        budgetChars: mcpResourceBudgets.learnerProfileSummary
      },
      {
        uri: "waypoint://lesson/community/summary",
        textChars: lessonSummaryResource.length,
        budgetChars: mcpResourceBudgets.lessonMapSummary
      }
    ],
    escapeHatches: [
      {
        tool: "generate_teacher_packet",
        mode: "full",
        textChars: textChars(fullPacket),
        structuredChars: JSON.stringify(fullPacket.structuredContent).length,
        returns: ["handoutSections", "miniMaterials", "evidenceTrace"]
      }
    ],
    responses: [
      responseMetric("generate_teacher_packet", "compact", packet, {
        text: mcpTextBudgets.generateTeacherPacketCompact,
        structured: mcpStructuredBudgets.generateTeacherPacketCompact
      }),
      responseMetric("get_learner_profile", "summary", profile, {
        text: mcpTextBudgets.getLearnerProfileSummary
      }),
      responseMetric("get_lesson_map", "summary", lesson, {
        text: mcpTextBudgets.getLessonMapSummary
      }),
      responseMetric("explain_modification", "receipt", receipt, {
        text: mcpTextBudgets.explainModificationReceipt,
        structured: mcpStructuredBudgets.explainModificationReceipt
      }),
      responseMetric("review_packet_quality", "summary", quality, {
        text: mcpTextBudgets.reviewPacketQualitySummary
      }),
      responseMetric("explain_evidence", "lookup", evidence, {
        text: mcpTextBudgets.explainEvidenceLookup
      }),
      responseMetric("render_evidence_audit", "summary", audit, {
        text: mcpTextBudgets.renderEvidenceAuditSummary,
        structured: mcpStructuredBudgets.renderEvidenceAuditSummary
      })
    ],
    reviewerRule: "The default path spends context on decisions and IDs, then pulls quote-level receipts only when asked."
  });

  console.log(
    JSON.stringify(
      {
        mcpSmoke: "passed",
        tools: tools.tools.length,
        resources: resources.resources.length,
        prompts: prompts.prompts.length,
        toolCatalogChars: manifestMetrics.totalChars,
        promptCatalogChars: promptMetrics.totalChars,
        handoffPromptChars: handoffPromptText.length,
        largestToolManifestChars: Math.max(...manifestMetrics.tools.map((tool) => tool.totalChars)),
        compactRecommendations: packet.structuredContent.modifications.length,
        fullDetailStructuredChars: JSON.stringify(fullPacket.structuredContent).length,
        smokeReport: smokeReportPath
      },
      null,
      2
    )
  );
} finally {
  await client.close();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertTextBudget(result, label, maxCharacters) {
  const text = result.content
    ?.filter((entry) => entry.type === "text")
    .map((entry) => entry.text)
    .join("\n")
    .trim();
  assert(text, `${label} returned no text content`);
  assert(text.length <= maxCharacters, `${label} text content is ${text.length} chars, over ${maxCharacters}`);
}

function assertStructuredBudget(result, label, maxCharacters) {
  assert(result.structuredContent, `${label} returned no structured content`);
  const chars = JSON.stringify(result.structuredContent).length;
  assert(chars <= maxCharacters, `${label} structured content is ${chars} chars, over ${maxCharacters}`);
}

function responseMetric(tool, mode, result, budgets) {
  return {
    tool,
    mode,
    textChars: textChars(result),
    textBudgetChars: budgets.text,
    structuredChars: result.structuredContent ? JSON.stringify(result.structuredContent).length : 0,
    structuredBudgetChars: budgets.structured ?? null
  };
}

function textChars(result) {
  return (
    result.content
      ?.filter((entry) => entry.type === "text")
      .map((entry) => entry.text)
      .join("\n")
      .trim().length ?? 0
  );
}

function writeSmokeReport(report) {
  const examplesDir = join(process.cwd(), "examples");
  mkdirSync(examplesDir, { recursive: true });
  const relativePath = "examples/mcp-smoke-report.json";
  writeFileSync(join(process.cwd(), relativePath), `${JSON.stringify(report, null, 2)}\n`);
  return relativePath;
}

async function readTextResource(client, uri) {
  const result = await client.readResource({ uri });
  const text = result.contents
    ?.map((entry) => entry.text ?? "")
    .join("\n")
    .trim();
  assert(text, `${uri} returned no text`);
  return text;
}

function measureToolManifest(tools) {
  const compactTools = tools.map((tool) => ({
    name: tool.name,
    title: tool.title,
    description: tool.description,
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema
  }));
  const measuredTools = tools.map((tool, index) => {
    return {
      name: tool.name,
      totalChars: JSON.stringify(compactTools[index]).length,
      inputSchemaChars: JSON.stringify(tool.inputSchema).length,
      outputSchemaChars: JSON.stringify(tool.outputSchema).length,
      descriptionChars: (tool.description ?? "").length
    };
  });
  return {
    totalChars: JSON.stringify(compactTools).length,
    tools: measuredTools
  };
}

function measurePromptManifest(prompts) {
  const compactPrompts = prompts.map((prompt) => ({
    name: prompt.name,
    description: prompt.description,
    arguments: prompt.arguments
  }));
  const measuredPrompts = prompts.map((prompt, index) => ({
    name: prompt.name,
    totalChars: JSON.stringify(compactPrompts[index]).length,
    descriptionChars: (prompt.description ?? "").length,
    argumentsChars: JSON.stringify(prompt.arguments ?? []).length
  }));
  return {
    totalChars: JSON.stringify(compactPrompts).length,
    prompts: measuredPrompts
  };
}
