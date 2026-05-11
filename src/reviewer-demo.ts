import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTeacherPacket, type McpSmokeReceipt, reviewerWorkflowMarkdown } from "./generator.js";

const packet = buildTeacherPacket({ minutesAvailable: 15, emphasis: "balanced" });
const smokeReportPath = join(process.cwd(), "examples", "mcp-smoke-report.json");
const smokeReceipt = existsSync(smokeReportPath)
  ? (JSON.parse(readFileSync(smokeReportPath, "utf8")) as McpSmokeReceipt)
  : undefined;

console.log(reviewerWorkflowMarkdown(packet, undefined, smokeReceipt));
