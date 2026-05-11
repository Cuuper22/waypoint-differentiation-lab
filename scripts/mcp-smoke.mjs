import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mcpManifestBudgets, mcpTextBudgets } from "../dist/mcp-budgets.js";

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
  "waypoint://case/learner-7a/profile",
  "waypoint://lesson/community/map",
  "waypoint://packet/community/learner-7a"
];

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

  const packet = await client.callTool({
    name: "generate_teacher_packet",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable", detail: "compact" }
  });
  assertTextBudget(packet, "generate_teacher_packet compact", mcpTextBudgets.generateTeacherPacketCompact);
  assert(packet.structuredContent?.detail === "compact", "generate_teacher_packet did not return compact structured content");
  assert(packet.structuredContent?.quality?.passed === true, "Compact packet quality did not pass");
  assert(
    packet.structuredContent?.modifications?.every((modification) => modification.standardPreserved === "RI.7.2"),
    "Compact packet did not preserve RI.7.2 on every recommendation"
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
  assert(audit.structuredContent?.detail === "summary", "render_evidence_audit default should be summary detail");

  console.log(
    JSON.stringify(
      {
        mcpSmoke: "passed",
        tools: tools.tools.length,
        resources: resources.resources.length,
        toolCatalogChars: manifestMetrics.totalChars,
        largestToolManifestChars: Math.max(...manifestMetrics.tools.map((tool) => tool.totalChars)),
        compactRecommendations: packet.structuredContent.modifications.length
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
