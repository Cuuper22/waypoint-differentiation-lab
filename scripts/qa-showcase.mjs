import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const showcaseUrl = process.env.SHOWCASE_URL ?? "http://127.0.0.1:5173/";
const outDir = join(process.cwd(), "qa");
const userDataDir = mkdtempSync(join(tmpdir(), "waypoint-chrome-qa-"));
const port = 9300 + Math.floor(Math.random() * 400);
const chromePath = process.env.CHROME_PATH ?? findChrome();

mkdirSync(outDir, { recursive: true });

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
  await delay(300);
  try {
    rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  } catch {
    // Windows can hold the Chromium profile for a moment after the process exits.
  }
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

  const interaction = await evaluate(cdp, interactionScript());
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

function interactionScript() {
  return `(() => new Promise((resolve) => {
      const failures = [];
      const wait = (ms) => new Promise((done) => setTimeout(done, ms));
    (async () => {
      document.documentElement.style.scrollBehavior = "auto";
      const required = ["#problem", "#mcp", "#packet", "#receipts", "#quality", "#under-hood"];
      for (const selector of required) {
        if (!document.querySelector(selector)) failures.push("missing section " + selector);
      }

      const heroButton = document.querySelector('[data-scroll="#packet"]');
      const receiptButton = document.querySelector('[data-scroll="#receipts"]');
      if (!heroButton || !receiptButton) failures.push("missing hero action buttons");

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
      for (const asset of ["showcase-hero.png", "evidence-flow.svg", "classroom-artifact.svg", "texture-grid.svg"]) {
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
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("Chrome or Edge was not found. Set CHROME_PATH to a Chromium executable.");
  return found;
}
