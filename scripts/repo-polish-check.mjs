#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";

const textExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".mjs",
  ".svg",
  ".ts",
  ".txt",
  ".yaml",
  ".yml"
]);

const requiredFiles = [
  "README.md",
  "assets/showcase-preview.gif",
  "challenge-data/README.md",
  "showcase/index.html",
  "showcase/src/generated-data.js",
  "showcase/public/generated/cinematic-chaos.png",
  "showcase/public/generated/cinematic-rail.png",
  "showcase/public/generated/cinematic-packet.png"
];

const legacyCaseName = ["Jas", "mine"].join("");
const staleStudentUri = ["waypoint://student/", legacyCaseName.toLowerCase(), "/profile"].join("");
const oldProfileResourceId = [legacyCaseName.toLowerCase(), "profile"].join("-");
const genericDumpPhrase = ["comprehensive", "solution"].join(" ");
const machineGeneratedFraming = ["AI", "generated"].join("[- ]");
const workflowHandoffFraming = ["AI agent", "workflow"].join(" ");
const forbiddenPatterns = [
  {
    label: "legacy person-specific case name",
    pattern: new RegExp(legacyCaseName, "i")
  },
  {
    label: "old student URI",
    pattern: new RegExp(escapeRegex(staleStudentUri), "i")
  },
  {
    label: "old profile resource id",
    pattern: new RegExp(escapeRegex(oldProfileResourceId), "i")
  },
  {
    label: "generic dump phrase",
    pattern: new RegExp(escapeRegex(genericDumpPhrase), "i")
  },
  {
    label: "machine-generated framing",
    pattern: new RegExp(machineGeneratedFraming, "i")
  },
  {
    label: "workflow handoff framing",
    pattern: new RegExp(escapeRegex(workflowHandoffFraming), "i")
  }
];

const requiredSnippets = [
  {
    file: "README.md",
    snippets: [
      "https://cuuper22.github.io/waypoint-differentiation-lab/",
      "assets/showcase-preview.gif",
      "npm run submission:check",
      "compact-first MCP calls",
      "9,000-character startup budget",
      "RI.7.2"
    ]
  },
  {
    file: "challenge-data/README.md",
    snippets: ["does not re-host", "pseudonymized", "challenge"]
  },
  {
    file: "src/server.ts",
    snippets: [
      "waypoint://case/learner-7a/summary",
      "waypoint://lesson/community/summary",
      "Start with the learner-profile-summary"
    ]
  },
  {
    file: "showcase/index.html",
    snippets: [
      "Waypoint Differentiation Lab",
      "og:image",
      "cinematic reviewer walkthrough"
    ]
  }
];

const failures = [];
const trackedFiles = gitTrackedFiles();
const textFiles = trackedFiles.filter((file) => textExtensions.has(extensionOf(file)));

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`missing required public artifact: ${file}`);
}

for (const file of requiredFiles.filter((file) => existsSync(file))) {
  if (statSync(file).size === 0) failures.push(`empty required public artifact: ${file}`);
}

for (const { file, snippets } of requiredSnippets) {
  const text = readMaybe(file);
  if (!text) {
    failures.push(`cannot read required text file: ${file}`);
    continue;
  }
  for (const snippet of snippets) {
    if (!text.includes(snippet)) failures.push(`${file} is missing: ${snippet}`);
  }
}

for (const file of textFiles) {
  const text = readMaybe(file);
  if (!text) continue;
  for (const { label, pattern } of forbiddenPatterns) {
    if (pattern.test(text)) failures.push(`${file} contains ${label}`);
  }
}

if (failures.length) {
  console.error(
    JSON.stringify(
      {
        repoPolish: "failed",
        filesScanned: textFiles.length,
        failures
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      repoPolish: "passed",
      filesScanned: textFiles.length,
      requiredArtifacts: requiredFiles.length,
      forbiddenPatterns: forbiddenPatterns.length
    },
    null,
    2
  )
);

function gitTrackedFiles() {
  return execFileSync("git", ["ls-files"], { encoding: "utf8" })
    .split(/\r?\n/)
    .map((file) => file.trim())
    .filter(Boolean);
}

function readMaybe(file) {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function extensionOf(file) {
  const dot = file.lastIndexOf(".");
  return dot === -1 ? "" : file.slice(dot).toLowerCase();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
