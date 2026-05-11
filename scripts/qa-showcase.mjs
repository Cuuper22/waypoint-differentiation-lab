import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const showcaseUrl = process.env.SHOWCASE_URL ?? "http://127.0.0.1:5173/";
const outDir = join(process.cwd(), "qa");
const userDataDir = mkdtempSync(join(tmpdir(), "waypoint-chrome-qa-"));
const port = 9300 + Math.floor(Math.random() * 400);
const chromePath = process.env.CHROME_PATH ?? findChrome();
const generatedDataUrl = pathToFileURL(join(process.cwd(), "showcase", "src", "generated-data.js")).href;
const { data: generatedData } = await import(generatedDataUrl);
const expectedCatalogBudget = generatedData.mcpStats.catalogBudget.budget;
const expectedPromptMessageBudget = generatedData.mcpStats.promptBudget.messageBudget;
const expectedSmokeMeter = generatedData.mcpStats.measuredSmoke?.rows?.[0]?.value ?? "smoke-tested";
const expectedHeroProofs = [
  `${generatedData.mcpStats.compactPercentOfFull}% of full packet`,
  `${generatedData.packet.preservedStandard} preserved`,
  expectedSmokeMeter,
  generatedData.verification?.proof ?? "tests + smoke + browser QA"
];

mkdirSync(outDir, { recursive: true });

const managedServer = await ensureShowcaseServer();
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--disable-gpu",
    "--no-first-run",
    "--disable-default-apps",
    "--window-size=1440,1100",
    "about:blank"
  ],
  { stdio: "ignore" }
);

try {
  const target = await waitForTarget(port);
  const cdp = await connectCdp(target.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Log.enable");

  const desktop = await runViewport(cdp, {
    name: "desktop",
    width: 1440,
    height: 1100,
    mobile: false,
    deviceScaleFactor: 1
  });

  const mobile = await runViewport(cdp, {
    name: "mobile",
    width: 390,
    height: 844,
    mobile: true,
    deviceScaleFactor: 2
  });

  const report = {
    url: showcaseUrl,
    serverStarted: Boolean(managedServer),
    screenshots: {
      desktop: "qa/desktop.png",
      mobile: "qa/mobile.png"
    },
    desktop,
    mobile
  };

  writeFileSync(join(outDir, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

  const failures = [...desktop.failures, ...mobile.failures];
  console.log(JSON.stringify(report, null, 2));
  if (failures.length > 0) {
    process.exitCode = 1;
  }
} finally {
  chrome.kill("SIGKILL");
  if (managedServer) {
    managedServer.kill("SIGTERM");
  }
  await delay(300);
  try {
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    // Windows can hold the Chromium profile for a moment after the process exits.
  }
}

async function ensureShowcaseServer() {
  if (await canReach(showcaseUrl)) return null;

  const url = new URL(showcaseUrl);
  if (!isLocalHost(url.hostname)) {
    throw new Error(`SHOWCASE_URL is not reachable and cannot be auto-started: ${showcaseUrl}`);
  }

  const viteBin = join(process.cwd(), "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    throw new Error("Vite is not installed. Run npm install before visual QA.");
  }
  const host = url.hostname === "[::1]" ? "::1" : url.hostname;

  const server = spawn(
    process.execPath,
    [
      viteBin,
      "--config",
      "showcase/vite.config.js",
      "--host",
      host,
      "--port",
      url.port || "5173",
      "--strictPort"
    ],
    {
      stdio: "ignore",
      env: { ...process.env, BROWSER: "none" }
    }
  );

  await waitForHttp(showcaseUrl, 15000, server);
  return server;
}

async function waitForHttp(url, timeoutMs, processHandle) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Showcase server exited before ${url} became reachable.`);
    }
    if (await canReach(url)) return;
    await delay(150);
  }
  throw new Error(`Timed out waiting for showcase server at ${url}`);
}

async function canReach(url) {
  try {
    const response = await fetch(url, { method: "GET" });
    return response.ok;
  } catch {
    return false;
  }
}

function isLocalHost(hostname) {
  return hostname === "127.0.0.1" || hostname === "localhost" || hostname === "::1" || hostname === "[::1]";
}

async function runViewport(cdp, viewport) {
  cdp.clearEvents();
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  });
  await cdp.send("Page.navigate", { url: showcaseUrl });
  await cdp.waitForEvent("Page.loadEventFired", 10000);
  await delay(900);

  const interaction = await evaluate(
    cdp,
    interactionScript(expectedCatalogBudget, expectedPromptMessageBudget, expectedHeroProofs, expectedSmokeMeter)
  );
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    fromSurface: true
  });
  writeFileSync(join(outDir, `${viewport.name}.png`), Buffer.from(screenshot.data, "base64"));

  const consoleProblems = cdp.events.filter((event) => {
    if (event.method === "Runtime.exceptionThrown") return true;
    if (event.method !== "Log.entryAdded") return false;
    return ["error", "warning"].includes(event.params.entry.level);
  });

  const failures = [];
  if (consoleProblems.length > 0) failures.push(`${viewport.name}: console warnings/errors detected`);
  failures.push(...interaction.failures.map((failure) => `${viewport.name}: ${failure}`));

  return {
    viewport,
    failures,
    consoleProblems: consoleProblems.map((event) => event.params),
    interaction
  };
}

function interactionScript(expectedCatalogBudget, expectedPromptMessageBudget, expectedHeroProofs, expectedSmokeMeter) {
  return `(() => new Promise((resolve) => {
      const failures = [];
      const wait = (ms) => new Promise((done) => setTimeout(done, ms));
      const expectedHeroProofs = ${JSON.stringify(expectedHeroProofs)};
      const expectedSmokeMeter = ${JSON.stringify(expectedSmokeMeter)};
    (async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const required = [
        "#problem",
        "#mcp",
        "#packet",
        "#receipts",
        "#quality",
        "#under-hood",
        "#rubric-map",
        "#review-path"
      ];
      for (const selector of required) {
        if (!document.querySelector(selector)) failures.push("missing section " + selector);
      }

      const heroButton = document.querySelector('[data-scroll="#packet"]');
      const receiptButton = document.querySelector('[data-scroll="#receipts"]');
      if (!heroButton || !receiptButton) failures.push("missing hero action buttons");
      const sourceLink = document.querySelector("[data-source-link]")?.href ?? "";
      if (!sourceLink.includes("github.com/Cuuper22/waypoint-differentiation-lab")) {
        failures.push("first screen is missing source and tests link");
      }
      const heroProofText = document.querySelector("[data-hero-proof]")?.textContent ?? "";
      for (const proof of expectedHeroProofs) {
        if (!heroProofText.includes(proof)) failures.push("hero proof pulse missing " + proof);
      }
      if (document.querySelectorAll("[data-hero-proof] a").length !== 4) {
        failures.push("hero proof pulse did not render four proof links");
      }

      await wait(1600);
      if (!document.body.classList.contains("cinema-playing")) {
        failures.push("cinematic reel did not autoplay");
      }
      if (document.querySelector("[data-play]")?.getAttribute("aria-label") !== "Pause cinematic sequence") {
        failures.push("cinematic reel did not expose the pause state while autoplaying");
      }
      if (document.querySelector(".scene-dot.is-active strong")?.textContent === "01 / 03") {
        failures.push("cinematic reel did not advance past the opening frame");
      }

      heroButton?.click();
      await wait(700);
      if (window.scrollY < document.querySelector("#problem").offsetTop - 80) {
        failures.push("hero packet button did not scroll");
      }

      receiptButton?.click();
      await wait(700);
      const receiptTop = document.querySelector("#receipts").getBoundingClientRect().top;
      if (Math.abs(receiptTop) > window.innerHeight * 0.45) failures.push("receipt button did not reach receipts");

      const recommendationButtons = Array.from(document.querySelectorAll("[data-mod-list] button"));
      if (recommendationButtons.length < 5) failures.push("recommendation list did not render");
      for (const button of recommendationButtons.slice(0, 6)) {
        button.click();
        await wait(70);
      }

      const active = document.querySelector("[data-mod-list] button.is-active");
      const detailText = document.querySelector("[data-receipt-detail]")?.textContent ?? "";
      if (!active) failures.push("no active receipt after clicking recommendations");
      if (!detailText.includes("IEP quote") || !detailText.includes("UDL alignment")) {
        failures.push("receipt detail is missing evidence trace labels");
      }
      const morph = document.querySelector("[data-evidence-morph]");
      const morphText = morph?.textContent ?? "";
      if (
        !morphText.includes("IEP quote") ||
        !morphText.includes("Lesson demand") ||
        !morphText.includes("UDL alignment") ||
        !morphText.includes("Teacher move")
      ) {
        failures.push("evidence morph did not render source-to-teacher proof labels");
      }
      if (morph?.dataset.activeModification !== active?.dataset.modificationId) {
        failures.push("evidence morph did not sync to the active receipt");
      }
      if (document.querySelectorAll(".morph-rails .rail").length < 3) {
        failures.push("evidence morph rails did not render");
      }

      document.querySelector("[data-play]")?.click();
      await wait(450);
      document.querySelector("[data-play]")?.click();
      const activeScene = document.querySelector(".scene-dot.is-active");
      if (!activeScene) failures.push("cinematic scrub did not activate a scene");
      const reelCards = Array.from(document.querySelectorAll("[data-reel-card]"));
      const activeReel = document.querySelector("[data-reel-card].is-active");
      if (reelCards.length !== 3) failures.push("directed hero reel did not render three cards");
      const activeSceneIndex = Array.from(document.querySelectorAll(".scene-dot")).findIndex((node) =>
        node.classList.contains("is-active")
      );
      if (!activeReel || activeReel.dataset.reelScene !== String(activeSceneIndex)) {
        failures.push("directed hero reel did not sync to the cinematic scene");
      }

      document.querySelector("[data-run-demo]")?.click();
      await wait(850);
      const demoDirector = document.querySelector("[data-demo-director]");
      const demoText = document.querySelector("[data-demo-status]")?.textContent ?? "";
      const demoProgress = getComputedStyle(document.querySelector("[data-demo-progress]")).transform;
      if (!demoDirector || demoDirector.hidden) failures.push("guided reviewer demo did not open");
      if (!demoText || demoText === "Ready") failures.push("guided reviewer demo did not advance status");
      if (demoProgress === "none") failures.push("guided reviewer demo progress did not animate");
      document.querySelector("[data-stop-demo]")?.click();
      await wait(120);
      if (!document.querySelector("[data-demo-director]")?.hidden) failures.push("guided reviewer demo did not stop");

      document.querySelector("[data-run-detector]")?.click();
      await wait(120);
      const detectorText = document.querySelector("[data-detector-output]")?.textContent ?? "";
      if (!detectorText.includes("Flagged")) failures.push("quality detector demo did not update");

      const teacherReview = document.querySelector("[data-teacher-review]");
      const teacherReviewText = teacherReview?.textContent ?? "";
      if (
        !teacherReviewText.includes("Teacher review handoff") ||
        !teacherReviewText.includes("Teacher stays in the chair") ||
        !teacherReviewText.includes("Use tomorrow")
      ) {
        failures.push("teacher review handoff did not render");
      }
      const reviewChoices = Array.from(document.querySelectorAll("[data-review-choice]"));
      if (reviewChoices.length !== 3) failures.push("teacher review handoff did not render three choices");
      reviewChoices[1]?.click();
      await wait(120);
      const editedReviewText = document.querySelector("[data-teacher-review]")?.textContent ?? "";
      if (!editedReviewText.includes("Shorten the student text")) {
        failures.push("teacher review handoff did not switch to the edit decision");
      }
      Array.from(document.querySelectorAll("[data-review-choice]"))[2]?.click();
      await wait(220);
      if (document.querySelector("[data-review-state]")?.dataset.reviewState !== "Open receipt") {
        failures.push("teacher review handoff did not mark the receipt decision");
      }
      if (!document.querySelector('[data-mod-list] button[data-modification-id="mod-short-response-frame"]')?.classList.contains("is-active")) {
        failures.push("teacher review receipt action did not open the selected receipt");
      }

      const payloadText = document.querySelector("[data-payload-meter]")?.textContent ?? "";
      if (!payloadText.includes("less default payload") || !payloadText.includes("Compact default")) {
        failures.push("payload meter did not render compact MCP stats");
      }
      if (
        !payloadText.includes("Full detail stays one call away") ||
        !payloadText.includes('detail: "full"') ||
        !payloadText.includes("all evidenceTrace objects")
      ) {
        failures.push("payload meter did not render the full-detail escape hatch");
      }
      const payloadModes = Array.from(document.querySelectorAll("[data-payload-mode]"));
      if (payloadModes.length !== 3) failures.push("payload meter did not render three packet modes");
      payloadModes[2]?.click();
      await wait(120);
      const expandedPayloadText = document.querySelector("[data-payload-meter]")?.textContent ?? "";
      if (!expandedPayloadText.includes("45 min") || !expandedPayloadText.includes("9 recommendations")) {
        failures.push("payload meter did not switch to the full-support packet mode");
      }
      if (!document.querySelector('[data-payload-mode="2"]')?.classList.contains("is-active")) {
        failures.push("payload meter did not mark the selected packet mode");
      }

      const consoleText = document.querySelector("[data-mcp-console]")?.textContent ?? "";
      if (
        !consoleText.includes("generate_teacher_packet") ||
        !consoleText.includes("explain_modification") ||
        !consoleText.includes("review_packet_quality")
      ) {
        failures.push("MCP call console did not render the compact request/response rhythm");
      }
      if (!consoleText.includes("MCP budget ledger") || !consoleText.includes("tool catalog <= ${expectedCatalogBudget} chars")) {
        failures.push("MCP call console did not render startup budget");
      }
      if (
        !consoleText.includes("Prompt contract") ||
        !consoleText.includes("differentiate_community_lesson <= ${expectedPromptMessageBudget} chars") ||
        !consoleText.includes("Route, not packet")
      ) {
        failures.push("MCP call console did not render prompt budget contract");
      }
      if (
        !consoleText.includes("Real stdio meter") ||
        !consoleText.includes(expectedSmokeMeter) ||
        !consoleText.includes("compact response") ||
        !consoleText.includes("examples/mcp-smoke-report.json")
      ) {
        failures.push("MCP call console did not render measured smoke meter");
      }
      const mcpSteps = Array.from(document.querySelectorAll("[data-mcp-step]"));
      if (mcpSteps.length !== 4) failures.push("MCP flow did not render four interactive calls");
      mcpSteps[1]?.click();
      await wait(120);
      const mcpDetailText = document.querySelector("[data-mcp-detail]")?.textContent ?? "";
      if (!mcpDetailText.includes("structuredContent") || !mcpDetailText.includes("evidenceTrace")) {
        failures.push("MCP flow did not reveal the receipt structuredContent detail");
      }
      if (!document.querySelector('[data-mcp-step="1"]')?.classList.contains("is-active")) {
        failures.push("MCP flow did not mark the selected call");
      }
      if (!consoleText.includes("get_learner_profile <= 520 chars")) {
        failures.push("MCP call console did not render tool text-channel budgets");
      }
      if (!consoleText.includes("learner-profile summary resource <= 900 chars")) {
        failures.push("MCP call console did not render resource budgets");
      }

      const reviewText = document.querySelector("#review-path")?.textContent ?? "";
      if (!reviewText.includes("npm run submission:check") || !reviewText.includes("Five-Minute Reviewer Path")) {
        failures.push("reviewer path scorecard did not render");
      }
      const progressText = document.querySelector("[data-progress-loop]")?.textContent ?? "";
      for (const proof of [
        "Progress monitoring without a second form",
        "Boxed claim present: yes / not yet",
        "One literal central-idea answer correct",
        "Receipt on click"
      ]) {
        if (!progressText.includes(proof)) failures.push("progress monitoring loop missing " + proof);
      }
      if (document.querySelectorAll("[data-progress-check]").length !== 4) {
        failures.push("progress monitoring loop did not render four checks");
      }
      const proofLinks = Array.from(document.querySelectorAll("[data-proof-dock] a"));
      if (proofLinks.length !== 4) failures.push("proof dock did not render four direct links");
      if (!reviewText.includes("Smoke report") || !reviewText.includes("measured stdio budgets")) {
        failures.push("proof dock did not render the MCP smoke report shortcut");
      }
      const proofHrefs = proofLinks.map((link) => link.href);
      if (!proofHrefs.some((href) => href.endsWith("/examples/mcp-smoke-report.json"))) {
        failures.push("proof dock is missing the mcp-smoke-report link");
      }

      const rubricText = document.querySelector("#rubric-map")?.textContent ?? "";
      for (const criterion of [
        "Output quality",
        "Architecture decisions",
        "Code quality",
        "Domain understanding"
      ]) {
        if (!rubricText.includes(criterion)) failures.push("rubric map missing " + criterion);
      }

      const images = Array.from(document.images).map((image) => ({
        src: image.currentSrc || image.src,
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight
      }));
      for (const image of images) {
        if (!image.complete || image.naturalWidth < 1 || image.naturalHeight < 1) {
          failures.push("asset failed to load: " + image.src);
        }
      }

      const scrollStop = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= scrollStop; y += Math.max(240, window.innerHeight * 0.72)) {
        window.scrollTo({ top: y, left: 0, behavior: "instant" });
        await wait(90);
      }
      window.scrollTo({ top: document.documentElement.scrollHeight, left: 0, behavior: "instant" });
      await wait(240);

      const resources = performance.getEntriesByType("resource").map((entry) => entry.name);
      for (const asset of [
        "cinematic-chaos.png",
        "cinematic-rail.png",
        "cinematic-packet.png",
        "texture-grid.svg"
      ]) {
        if (!resources.some((name) => name.includes(asset))) failures.push("generated asset not requested: " + asset);
      }

      const horizontalOverflow = document.documentElement.scrollWidth > window.innerWidth + 2;
      if (horizontalOverflow) {
        failures.push("horizontal overflow detected: " + document.documentElement.scrollWidth + " > " + window.innerWidth);
      }

      const tinyButtons = Array.from(document.querySelectorAll("button, a")).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32);
      }).length;
      if (tinyButtons > 0) failures.push("interactive target below 32px detected");

      resolve({
        failures,
        scrollHeight: document.documentElement.scrollHeight,
        images,
        generatedResources: resources.filter((name) => name.includes("/generated/")),
        activeReceipt: active?.dataset.modificationId ?? null,
        receiptDetailLength: detailText.length,
        horizontalOverflow
      });
    })();
  }))()`;
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Runtime evaluation failed");
  }
  return result.result.value;
}

async function waitForTarget(debugPort) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page");
      if (page?.webSocketDebuggerUrl) return page;
    } catch {
      await delay(120);
    }
  }
  throw new Error("Chrome DevTools target was not ready");
}

async function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  const pending = new Map();
  const eventWaiters = new Map();
  const events = [];
  let id = 0;

  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result ?? {});
      return;
    }

    if (payload.method) {
      events.push(payload);
      const waiters = eventWaiters.get(payload.method) ?? [];
      for (const waiter of waiters.splice(0)) waiter(payload);
      eventWaiters.set(payload.method, waiters);
    }
  });

  return {
    events,
    clearEvents() {
      events.length = 0;
    },
    send(method, params = {}) {
      const messageId = ++id;
      socket.send(JSON.stringify({ id: messageId, method, params }));
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
      });
    },
    waitForEvent(method, timeoutMs) {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${method}`)), timeoutMs);
        const waiters = eventWaiters.get(method) ?? [];
        waiters.push((payload) => {
          clearTimeout(timeout);
          resolve(payload);
        });
        eventWaiters.set(method, waiters);
      });
    }
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
  ].filter(Boolean);
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("Chrome or Edge was not found. Set CHROME_PATH to a Chromium executable.");
  return found;
}
