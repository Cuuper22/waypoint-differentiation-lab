import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const requiredTools = [
  "generate_teacher_packet",
  "explain_modification",
  "review_packet_quality",
  "get_learner_profile",
  "get_lesson_map"
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
  for (const tool of requiredTools) {
    assert(toolNames.has(tool), `Missing MCP tool: ${tool}`);
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
  assertTextBudget(packet, "generate_teacher_packet compact", 1200);
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
  assertTextBudget(profile, "get_learner_profile summary", 520);
  assert(profile.structuredContent?.caseLabel === "Learner 7A", "get_learner_profile lost structured case label");

  const lesson = await client.callTool({
    name: "get_lesson_map",
    arguments: { phase: "all", includeEvidence: false }
  });
  assertTextBudget(lesson, "get_lesson_map summary", 900);
  assert(lesson.structuredContent?.chunks?.length >= 6, "get_lesson_map lost structured lesson chunks");

  const receipt = await client.callTool({
    name: "explain_modification",
    arguments: { modificationId: "mod-short-response-frame" }
  });
  assertTextBudget(receipt, "explain_modification receipt", 850);
  assert(
    receipt.structuredContent?.receipts?.preservedStandard === "RI.7.2",
    "explain_modification did not return a preserved-standard receipt"
  );

  const quality = await client.callTool({
    name: "review_packet_quality",
    arguments: { minutesAvailable: 5, emphasis: "minimum-viable" }
  });
  assertTextBudget(quality, "review_packet_quality summary", 480);
  assert(quality.structuredContent?.passed === true, "review_packet_quality did not pass the generated packet");

  console.log(
    JSON.stringify(
      {
        mcpSmoke: "passed",
        tools: tools.tools.length,
        resources: resources.resources.length,
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
