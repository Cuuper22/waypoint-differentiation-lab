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

  const interaction = await evaluate(cdp, interactionScript(expectedCatalogBudget));
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

function interactionScript(expectedCatalogBudget) {
  return `(() => new Promise((resolve) => {
      const failures = [];
      const wait = (ms) => new Promise((done) => setTimeout(done, ms));
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

      const payloadText = document.querySelector("[data-payload-meter]")?.textContent ?? "";
      if (!payloadText.includes("less default payload") || !payloadText.includes("Compact default")) {
        failures.push("payload meter did not render compact MCP stats");
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
