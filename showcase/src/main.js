import "./styles.css";
import { data } from "./generated-data.js";

const scenes = [
  {
    count: "01 / 03",
    label: "8:03am",
    title: "At 8:03am, “differentiate this” is not a strategy.",
    copy:
      "The teacher has a grade-level RI.7.2 lesson, one learner profile, and about twelve minutes before reality starts making demands."
  },
  {
    count: "02 / 03",
    label: "Receipts",
    title: "The useful part is not magic. It is provenance.",
    copy:
      "Learner evidence, lesson demand, UDL alignment, and quality checks become a visible rail instead of a hidden mush pile."
  },
  {
    count: "03 / 03",
    label: "Tomorrow",
    title: "The final object is classroom-ready, not committee-ready.",
    copy:
      "A teacher gets the move, the student-facing language, the material, the progress check, and the reason it preserves the standard."
  }
];

const frameEls = [...document.querySelectorAll(".cinema-frame")];
const reelCards = [...document.querySelectorAll("[data-reel-card]")];
const sceneCount = document.querySelector("[data-scene-count]");
const sceneTitle = document.querySelector("[data-scene-title]");
const sceneCopy = document.querySelector("[data-scene-copy]");
const sceneStrip = document.querySelector("[data-scene-strip]");
const playButton = document.querySelector("[data-play]");
const standard = document.querySelector("[data-standard]");
const qualityChip = document.querySelector("[data-quality-chip]");
const heroProof = document.querySelector("[data-hero-proof]");
const packetTitle = document.querySelector("[data-packet-title]");
const handoutSections = document.querySelector("[data-handout-sections]");
const progressLoop = document.querySelector("[data-progress-loop]");
const modList = document.querySelector("[data-mod-list]");
const receiptDetail = document.querySelector("[data-receipt-detail]");
const evidenceMorph = document.querySelector("[data-evidence-morph]");
const qualityGrid = document.querySelector("[data-quality-grid]");
const architecture = document.querySelector("[data-architecture]");
const payloadMeter = document.querySelector("[data-payload-meter]");
const mcpConsole = document.querySelector("[data-mcp-console]");
const detectorButton = document.querySelector("[data-run-detector]");
const detectorOutput = document.querySelector("[data-detector-output]");
const runDemoButton = document.querySelector("[data-run-demo]");
const stopDemoButton = document.querySelector("[data-stop-demo]");
const demoDirector = document.querySelector("[data-demo-director]");
const demoStatus = document.querySelector("[data-demo-status]");
const demoProgress = document.querySelector("[data-demo-progress]");

let currentScene = 0;
let playTimer = null;
let demoRunId = 0;
let currentPayloadMode = 1;
let currentMcpStep = 0;

frameEls.forEach((frame) => {
  const framePath = frame.dataset.frame;
  if (framePath) {
    frame.style.setProperty("--frame", `url("${new URL(framePath, window.location.href).href}")`);
  }
});

standard.textContent = data.packet.preservedStandard;
qualityChip.textContent = data.packet.qualityReport.passed ? "Quality passed" : "Needs review";
packetTitle.textContent = data.packet.teacherMode;

renderSceneStrip();
renderHeroProof();
renderHandout();
renderProgressLoop();
renderRecommendations();
renderQuality();
renderPayloadMeter();
renderMcpConsole();
renderArchitecture();
wireDetector();
wireReviewerDemo();
wireScrollButtons();
wireReveal();
startAmbientCanvas();
selectScene(0);

function renderSceneStrip() {
  sceneStrip.replaceChildren(
    ...scenes.map((scene, index) => {
      const button = document.createElement("button");
      button.className = "scene-dot";
      button.type = "button";
      button.setAttribute("aria-label", `Show scene ${index + 1}: ${scene.label}`);
      button.innerHTML = `<strong>${scene.count}</strong><span>${scene.label}</span>`;
      button.addEventListener("click", () => {
        stopPlayback();
        selectScene(index);
      });
      return button;
    })
  );

  playButton.addEventListener("click", () => {
    if (playTimer) {
      stopPlayback();
      return;
    }
    selectScene((currentScene + 1) % scenes.length);
    playTimer = window.setInterval(() => selectScene((currentScene + 1) % scenes.length), 2200);
    playButton.setAttribute("aria-label", "Pause cinematic sequence");
    playButton.classList.add("is-playing");
  });
}

function selectScene(index) {
  currentScene = index;
  const scene = scenes[index];
  frameEls.forEach((frame, frameIndex) => frame.classList.toggle("is-active", frameIndex === index));
  reelCards.forEach((card, cardIndex) => card.classList.toggle("is-active", cardIndex === index));
  sceneCount.textContent = scene.count;
  sceneTitle.textContent = scene.title;
  sceneCopy.textContent = scene.copy;
  [...sceneStrip.children].forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === index);
    button.setAttribute("aria-pressed", String(buttonIndex === index));
  });
}

function stopPlayback() {
  window.clearInterval(playTimer);
  playTimer = null;
  playButton.setAttribute("aria-label", "Play cinematic sequence");
  playButton.classList.remove("is-playing");
}

function renderHeroProof() {
  const smoke = data.mcpStats.measuredSmoke;
  const rows = [
    ["default payload", `${data.mcpStats.compactPercentOfFull}% of full packet`],
    ["standard", `${data.packet.preservedStandard} preserved`],
    ["MCP meter", smoke?.rows?.[0]?.value ?? "smoke-tested"],
    ["verification", data.verification?.proof ?? "tests + smoke + browser QA"]
  ];

  heroProof.replaceChildren(
    ...rows.map(([label, value]) => {
      const item = document.createElement("a");
      item.className = "hero-proof";
      item.href = label === "verification" ? "#review-path" : label === "MCP meter" ? "#under-hood" : "#receipts";
      item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      return item;
    })
  );
}

function renderHandout() {
  const sections = [
    {
      title: "Before Class",
      items: data.packet.useFirst
    },
    {
      title: "Materials That Match The Move",
      items: data.miniMaterials.slice(0, 5).map((material) => material.name)
    },
    {
      title: "Why It Is Defensible",
      items: [
        "Default packet keeps the standard explicit.",
        "Receipts load recommendation-by-recommendation.",
        "Student-facing language avoids adult labels."
      ]
    }
  ];

  handoutSections.replaceChildren(...sections.map(sectionTemplate));
}

function renderProgressLoop() {
  const loop = data.progressLoop;
  const header = document.createElement("div");
  header.className = "progress-loop-copy";
  header.innerHTML = `<span>${loop.standard}</span><h3>${loop.title}</h3><p>${loop.teacherMove}</p>`;

  const checks = document.createElement("div");
  checks.className = "progress-checks";
  checks.replaceChildren(
    ...loop.checks.map((check, index) => {
      const item = document.createElement("button");
      item.className = "progress-check";
      item.type = "button";
      item.dataset.progressCheck = String(index + 1);
      item.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><strong>${check}</strong>`;
      item.addEventListener("click", () => selectModification(loop.receiptId));
      return item;
    })
  );

  const receipt = document.createElement("a");
  receipt.className = "progress-receipt";
  receipt.href = "#receipts";
  receipt.addEventListener("click", () => selectModification(loop.receiptId));
  receipt.innerHTML = `<span>Receipt on click</span><strong>${loop.evidenceCheck}</strong>`;

  progressLoop.replaceChildren(header, checks, receipt);
}

function renderRecommendations() {
  const buttons = data.modifications.map((modification, index) => {
    const button = document.createElement("button");
    button.className = "receipt-pill";
    button.type = "button";
    button.dataset.modificationId = modification.id;
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
    button.append(textSpan(modification.lessonMoment), textSpan(modification.supportType));
    button.addEventListener("click", () => selectModification(modification.id));
    return button;
  });

  modList.replaceChildren(...buttons);
  selectModification(data.modifications[0].id);
}

function selectModification(id) {
  const modification = data.modifications.find((item) => item.id === id);
  if (!modification) return;

  for (const button of modList.querySelectorAll("button")) {
    const isActive = button.dataset.modificationId === id;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  }

  const trace = modification.evidenceTrace;
  renderEvidenceMorph(modification);

  const title = document.createElement("h3");
  title.textContent = modification.lessonMoment;

  const action = document.createElement("p");
  action.textContent = modification.teacherAction;

  const tags = document.createElement("div");
  tags.className = "trace-tags";
  tags.append(
    tag(`Support: ${modification.supportType}`),
    tag(`Standard: ${trace.standardPreserved}`),
    tag(`Default: compact`)
  );

  const grid = document.createElement("div");
  grid.className = "trace-grid";
  grid.append(
    traceBox("IEP quote", trace.iepQuote),
    traceBox("Lesson demand", trace.lessonDemand),
    traceBox("UDL alignment", trace.udlAlignment.map((item) => `${item.principle}: ${item.why}`).join(" ")),
    traceBox("Progress check", trace.progressCheck),
    traceBox("Student-facing text", modification.studentFacingText),
    traceBox("Barrier addressed", trace.barrierAddressed)
  );

  receiptDetail.replaceChildren(title, action, tags, grid);
}

function renderEvidenceMorph(modification) {
  const trace = modification.evidenceTrace;
  const sourceCopy = {
    iep: trimCopy(trace.iepQuote, 82),
    lesson: trimCopy(trace.lessonDemand, 82),
    udl: trimCopy(trace.udlAlignment.map((item) => item.principle).join(" + "), 48)
  };

  for (const [key, copy] of Object.entries(sourceCopy)) {
    const node = evidenceMorph.querySelector(`[data-morph-source="${key}"] strong`);
    if (node) node.textContent = copy;
  }

  const target = evidenceMorph.querySelector("[data-morph-target] strong");
  if (target) target.textContent = trimCopy(modification.teacherAction, 76);

  evidenceMorph.dataset.activeModification = modification.id;
  evidenceMorph.classList.remove("is-routing");
  evidenceMorph.offsetWidth;
  evidenceMorph.classList.add("is-routing");
}

function renderQuality() {
  const checks = [
    ["vagueAdvice", "Specific teacher actions", "No support-as-needed fog."],
    ["missingEvidence", "Evidence refs resolve", "IDs first. Quotes only when asked."],
    ["loweredRigor", "RI.7.2 preserved", "No sneaky easier worksheet swap."],
    ["unsafeStudentLanguage", "Safe student language", "Adult labels stay backstage."],
    ["materialsMatchRecommendations", "Materials match", "No orphan handouts wandering around."]
  ];

  qualityGrid.replaceChildren(
    ...checks.map(([key, title, copy]) => {
      const card = document.createElement("article");
      card.className = "quality-card";
      card.setAttribute("data-reveal", "");

      const dot = document.createElement("div");
      dot.className = "check-dot";
      dot.textContent = data.packet.qualityReport.checks[key] ? "OK" : "NO";

      const heading = document.createElement("h3");
      heading.textContent = title;

      const text = document.createElement("p");
      text.textContent = copy;

      card.append(dot, heading, text);
      return card;
    })
  );
}

function renderArchitecture() {
  const architectureItems = [
    ["Compact first", "generate_teacher_packet defaults to IDs, short actions, and quality status."],
    ["Deep on demand", "explain_modification returns the quote-level Receipts Rail for one support."],
    ["Typed surface", "schemas describe packet, trace, handout, and quality contracts without flooding the client."],
    ["Presentation layer", "MCP clients can turn compact packets into teacher prose only after they know what they need."]
  ];

  architecture.replaceChildren(
    ...architectureItems.map(([title, copy], index) => {
      const node = document.createElement("article");
      node.className = "arch-node";

      const number = document.createElement("div");
      number.className = "arch-index";
      number.textContent = String(index + 1);

      const heading = document.createElement("h3");
      heading.textContent = title;

      const text = document.createElement("p");
      text.textContent = copy;

      node.append(number, heading, text);
      return node;
    })
  );
}

function renderPayloadMeter() {
  const stats = data.mcpStats;
  const modes = data.packetModes ?? [];
  const mode = modes[currentPayloadMode] ?? {
    mode: "default",
    minutesAvailable: 45,
    defaultCall: "generate_teacher_packet({ detail: \"compact\" })",
    compactChars: stats.compactChars,
    fullChars: stats.fullChars,
    compactPercentOfFull: stats.compactPercentOfFull,
    savedPercent: stats.savedPercent,
    recommendations: data.modifications.length,
    materials: data.miniMaterials.length,
    modificationIds: data.modifications.map((modification) => modification.id)
  };
  const compactPercent = Math.max(4, Math.min(100, mode.compactPercentOfFull));

  const title = document.createElement("div");
  title.className = "payload-title";
  title.innerHTML = `<span>Payload meter</span><strong>${mode.savedPercent}% less default payload</strong>`;

  const switcher = document.createElement("div");
  switcher.className = "payload-switch";
  switcher.setAttribute("aria-label", "Packet size modes");
  switcher.replaceChildren(
    ...modes.map((packetMode, index) => {
      const button = document.createElement("button");
      button.className = "payload-mode";
      button.type = "button";
      button.dataset.payloadMode = String(index);
      button.setAttribute("aria-pressed", String(index === currentPayloadMode));
      button.innerHTML = `<strong>${packetMode.minutesAvailable} min</strong><span>${packetMode.recommendations} moves</span>`;
      button.classList.toggle("is-active", index === currentPayloadMode);
      button.addEventListener("click", () => {
        currentPayloadMode = index;
        renderPayloadMeter();
      });
      return button;
    })
  );

  const summary = document.createElement("div");
  summary.className = "payload-summary";
  summary.append(
    tag(`${mode.mode}`),
    tag(`${mode.recommendations} recommendations`),
    tag(`${mode.materials} materials`)
  );

  const rows = document.createElement("div");
  rows.className = "payload-rows";
  rows.append(
    payloadRow("Compact default", mode.compactChars, compactPercent, "IDs, short actions, quality status, next tool hints"),
    payloadRow("Full packet", mode.fullChars, 100, "Handout text, all traces, all materials, all receipts")
  );

  const command = document.createElement("pre");
  command.className = "payload-command";
  command.textContent = mode.defaultCall;

  const note = document.createElement("p");
  note.textContent = `${stats.onDemandTool} stays the deep-dive path. The packet size changes, the evidence model does not.`;

  payloadMeter.replaceChildren(title, switcher, summary, rows, command, note);
}

function renderMcpConsole() {
  const stats = data.mcpStats;
  const receipt =
    data.modifications.find((modification) => modification.id === "mod-short-response-frame") ?? data.modifications[0];
  const trace = receipt.evidenceTrace;
  const calls = data.mcpFlow ?? [
    {
      id: "packet",
      badge: "01",
      label: "Compact packet",
      command: 'generate_teacher_packet({ minutesAvailable: 15, emphasis: "balanced" })',
      textPreview: "Brief handoff first, structured IDs beside it.",
      textChars: stats.compactChars,
      structuredChars: stats.compactChars,
      hiddenPayload: "Full handout and quote table stay on demand.",
      response: [
        `${stats.compactPercentOfFull}% of full payload`,
        `${data.packet.useFirst.length} use-first moves`,
        "next: explain_modification"
      ],
      structuredFields: ["title", "modifications[]", "quality", "nextTools"]
    },
    {
      id: "receipt",
      badge: "02",
      label: "One receipt",
      command: `explain_modification({ modificationId: "${receipt.id}" })`,
      textPreview: "Quote-level evidence for one recommendation only.",
      textChars: 260,
      structuredChars: 2200,
      hiddenPayload: "Other receipts stay unloaded.",
      response: [trace.supportType, trace.standardPreserved, trace.udlAlignment.map((item) => item.principle).join(" + ")],
      structuredFields: ["modification", "evidenceTrace", "receipts"]
    },
    {
      id: "gate",
      badge: "03",
      label: "Quality gate",
      command: 'review_packet_quality({ minutesAvailable: 15, emphasis: "balanced" })',
      textPreview: "Small verdict, structured checks.",
      textChars: 260,
      structuredChars: 720,
      hiddenPayload: "No repeated packet body.",
      response: [
        data.packet.qualityReport.passed ? "passed" : "needs review",
        "vague advice: blocked",
        "unsafe language: blocked"
      ],
      structuredFields: ["passed", "checks", "flags", "summary"]
    }
  ];
  const selected = calls[currentMcpStep] ?? calls[0];

  const header = document.createElement("div");
  header.className = "mcp-console-header";
  header.append(textSpan("MCP call rhythm"), textSpan("packet -> receipt -> audit -> gate"));

  const flow = document.createElement("div");
  flow.className = "mcp-call-flow";
  flow.replaceChildren(...calls.map(mcpCallTemplate));
  const detail = mcpFlowDetail(selected);

  const budgetPanel = document.createElement("div");
  budgetPanel.className = "mcp-budget-panel";

  const budgetTitle = document.createElement("div");
  budgetTitle.className = "mcp-budget-title";
  budgetTitle.append(textSpan("MCP budget ledger"), textSpan("startup + response overhead"));

  const promptContract = stats.promptBudget ? mcpPromptTemplate(stats.promptBudget) : document.createDocumentFragment();
  const smokeMeter = mcpSmokeTemplate(stats.measuredSmoke);

  const budgetRows = document.createElement("div");
  budgetRows.className = "mcp-budget-grid";
  budgetRows.replaceChildren(
    ...[stats.catalogBudget, ...(stats.resourceBudgets ?? []), ...(stats.textBudgets ?? [])]
      .filter(Boolean)
      .map(mcpBudgetTemplate)
  );

  budgetPanel.append(budgetTitle, promptContract, smokeMeter, budgetRows);
  mcpConsole.replaceChildren(header, flow, detail, budgetPanel);
}

function mcpCallTemplate(call, index) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "mcp-call";
  row.dataset.mcpStep = String(index);
  row.classList.toggle("is-active", index === currentMcpStep);
  row.setAttribute("aria-pressed", String(index === currentMcpStep));
  row.addEventListener("click", () => {
    currentMcpStep = index;
    renderMcpConsole();
  });

  const badge = document.createElement("span");
  badge.className = "mcp-badge";
  badge.textContent = call.badge;

  const label = document.createElement("strong");
  label.className = "mcp-call-label";
  label.textContent = call.label;

  const command = document.createElement("pre");
  command.textContent = call.command;

  const response = document.createElement("ul");
  response.replaceChildren(...call.response.map((item) => listItem(item)));

  row.append(badge, label, command, response);
  return row;
}

function mcpFlowDetail(step) {
  const detail = document.createElement("div");
  detail.className = "mcp-call-detail";
  detail.dataset.mcpDetail = step.id;

  const copy = document.createElement("div");
  copy.className = "mcp-detail-copy";
  copy.append(textSpan("Selected call"), textSpan(step.hiddenPayload));

  const command = document.createElement("pre");
  command.textContent = step.command;

  const meters = document.createElement("div");
  meters.className = "mcp-detail-meters";
  meters.append(
    mcpSizePill("content", step.textChars),
    mcpSizePill("structuredContent", step.structuredChars)
  );

  const preview = document.createElement("p");
  preview.textContent = step.textPreview;

  const fields = document.createElement("ul");
  fields.className = "mcp-field-list";
  fields.replaceChildren(...step.structuredFields.map((field) => listItem(field)));

  detail.append(copy, command, meters, preview, fields);
  return detail;
}

function mcpSizePill(label, chars) {
  const pill = document.createElement("span");
  pill.className = "mcp-size-pill";
  pill.innerHTML = `<strong>${label}</strong><em>${Number(chars).toLocaleString("en-US")} chars</em>`;
  return pill;
}

function mcpBudgetTemplate(row) {
  const item = document.createElement("article");
  item.className = "mcp-budget";

  const top = document.createElement("div");
  top.className = "mcp-budget-top";
  top.append(textSpan(`${row.tool} <= ${row.budget} chars`), textSpan(row.mode));

  const split = document.createElement("p");
  split.textContent = `${row.textChannel} in content; ${row.structuredContent} in structuredContent.`;

  item.append(top, split);
  return item;
}

function mcpPromptTemplate(row) {
  const contract = document.createElement("article");
  contract.className = "mcp-prompt-contract";

  const copy = document.createElement("div");
  copy.className = "mcp-prompt-copy";

  const eyebrow = document.createElement("span");
  eyebrow.textContent = "Prompt contract";

  const title = document.createElement("strong");
  title.textContent = `${row.prompt} <= ${row.messageBudget} chars`;

  const note = document.createElement("p");
  note.textContent = "Route, not packet: summaries first, compact packet next, receipts only when a recommendation earns inspection.";

  copy.append(eyebrow, title, note);

  const chips = document.createElement("div");
  chips.className = "mcp-prompt-chips";
  chips.append(tag(`catalog <= ${row.catalogBudget} chars`), tag(row.textChannel), tag("no quote dump"));

  contract.append(copy, chips);
  return contract;
}

function mcpSmokeTemplate(meter) {
  if (!meter) return document.createDocumentFragment();

  const card = document.createElement("article");
  card.className = "mcp-smoke-card";

  const header = document.createElement("div");
  header.className = "mcp-smoke-header";

  const copy = document.createElement("div");
  copy.className = "mcp-smoke-copy";

  const label = document.createElement("span");
  label.textContent = "Measured run";

  const title = document.createElement("strong");
  title.textContent = meter.title;

  const note = document.createElement("p");
  note.textContent = `${meter.reportPath} - ${meter.startup}.`;

  copy.append(label, title, note);
  header.append(copy, tag(meter.result));

  const rows = document.createElement("div");
  rows.className = "mcp-smoke-rows";
  rows.replaceChildren(
    ...meter.rows.map((row) => {
      const item = document.createElement("div");
      item.className = "mcp-smoke-row";
      item.append(textSpan(row.label), textSpan(row.value));
      return item;
    })
  );

  const rule = document.createElement("p");
  rule.className = "mcp-smoke-rule";
  rule.textContent = meter.reviewerRule;

  card.append(header, rows, rule);
  return card;
}

function payloadRow(label, chars, percent, note) {
  const row = document.createElement("div");
  row.className = "payload-row";

  const meta = document.createElement("div");
  meta.className = "payload-meta";
  meta.innerHTML = `<strong>${label}</strong><span>${chars.toLocaleString("en-US")} chars</span>`;

  const bar = document.createElement("div");
  bar.className = "payload-bar";
  bar.innerHTML = `<span style="--payload-width: ${percent}%"></span>`;

  const text = document.createElement("p");
  text.textContent = note;

  row.append(meta, bar, text);
  return row;
}

function wireDetector() {
  detectorButton.addEventListener("click", () => {
    detectorOutput.replaceChildren();
    const label = document.createElement("span");
    label.textContent = "scan result";
    const result = document.createElement("p");
    result.textContent = "Flagged: vague advice, lowered rigor, missing evidence. Clipboard has spoken.";
    detectorOutput.append(label, result);
  });
}

function wireReviewerDemo() {
  runDemoButton.addEventListener("click", () => runReviewerDemo());
  stopDemoButton.addEventListener("click", () => stopReviewerDemo());
}

async function runReviewerDemo() {
  const runId = demoRunId + 1;
  demoRunId = runId;
  stopPlayback();
  document.body.classList.add("demo-running");
  demoDirector.hidden = false;

  const steps = [
    {
      label: "Start with the actual morning problem.",
      run: async () => {
        selectScene(0);
        await scrollToTarget("#top");
      }
    },
    {
      label: "Show the evidence rail, not a mystery box.",
      run: async () => {
        selectScene(1);
        await pause(900);
        await scrollToTarget("#mcp");
      }
    },
    {
      label: "Land on the teacher artifact.",
      run: async () => {
        selectScene(2);
        await scrollToTarget("#packet");
      }
    },
    {
      label: "Open a receipt and prove the support.",
      run: async () => {
        await scrollToTarget("#receipts");
        selectModification("mod-short-response-frame");
      }
    },
    {
      label: "Let the quality gate catch nonsense.",
      run: async () => {
        await scrollToTarget("#quality");
        detectorButton.click();
      }
    },
    {
      label: "End on the lightweight MCP design.",
      run: async () => {
        await scrollToTarget("#under-hood");
      }
    }
  ];

  for (let index = 0; index < steps.length; index += 1) {
    if (runId !== demoRunId) return;
    updateDemoProgress(index + 0.2, steps.length, steps[index].label);
    await steps[index].run();
    if (runId !== demoRunId) return;
    updateDemoProgress(index + 1, steps.length, steps[index].label);
    await pause(index === 0 ? 1300 : 1700);
  }

  updateDemoProgress(steps.length, steps.length, "Reviewer path complete. Receipts still available on click.");
  await pause(1400);
  if (runId === demoRunId) {
    demoDirector.hidden = true;
    document.body.classList.remove("demo-running");
  }
}

function stopReviewerDemo() {
  demoRunId += 1;
  demoDirector.hidden = true;
  document.body.classList.remove("demo-running");
}

function updateDemoProgress(index, total, label) {
  demoStatus.textContent = label;
  demoProgress.style.transform = `scaleX(${Math.min(1, Math.max(0.04, index / total))})`;
}

async function scrollToTarget(selector) {
  document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "start" });
  await pause(900);
}

function pause(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function sectionTemplate(section) {
  const article = document.createElement("article");
  article.className = "handout-section";

  const heading = document.createElement("h4");
  heading.textContent = section.title;

  const list = document.createElement("ul");
  list.append(
    ...section.items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    })
  );

  article.append(heading, list);
  return article;
}

function traceBox(title, copy) {
  const box = document.createElement("div");
  box.className = "trace-box";
  const heading = document.createElement("strong");
  heading.textContent = title;
  const text = document.createElement("p");
  text.textContent = copy;
  box.append(heading, text);
  return box;
}

function tag(text) {
  const element = document.createElement("span");
  element.className = "trace-tag";
  element.textContent = text;
  return element;
}

function trimCopy(text, max) {
  return text.length <= max ? text : `${text.slice(0, max - 3)}...`;
}

function listItem(text) {
  const item = document.createElement("li");
  item.textContent = text;
  return item;
}

function textSpan(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function wireScrollButtons() {
  for (const button of document.querySelectorAll("[data-scroll]")) {
    button.addEventListener("click", () => {
      const target = document.querySelector(button.dataset.scroll);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function wireReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      }
    },
    { threshold: 0.14 }
  );

  for (const item of document.querySelectorAll("[data-reveal]")) {
    observer.observe(item);
  }
}

function startAmbientCanvas() {
  const canvas = document.getElementById("ambient");
  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let tick = 0;

  const dots = Array.from({ length: 16 }, (_, index) => ({
    x: (index * 173) % 1000,
    y: (index * 97) % 700,
    radius: 80 + (index % 4) * 34,
    hue: ["#0f8b8d", "#e86f51", "#f7b733", "#8c68c8"][index % 4]
  }));

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#f8f0e4";
    context.fillRect(0, 0, width, height);

    for (const dot of dots) {
      const x = (dot.x + Math.sin(tick * 0.005 + dot.radius) * 42) % (width + 180);
      const y = (dot.y + Math.cos(tick * 0.004 + dot.radius) * 34) % (height + 180);
      const gradient = context.createRadialGradient(x, y, 0, x, y, dot.radius);
      gradient.addColorStop(0, `${dot.hue}20`);
      gradient.addColorStop(1, `${dot.hue}00`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, dot.radius, 0, Math.PI * 2);
      context.fill();
    }

    if (!reducedMotion) {
      tick += 1;
      requestAnimationFrame(draw);
    }
  }

  resize();
  draw();
  window.addEventListener("resize", resize);
}
