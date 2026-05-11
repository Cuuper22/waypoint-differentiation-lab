import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const showcaseUrl = process.env.SHOWCASE_URL ?? "http://127.0.0.1:5173/";
const outputPath = resolve(process.cwd(), "assets", "showcase-preview.gif");
const userDataDir = mkdtempSync(join(tmpdir(), "waypoint-chrome-preview-"));
const frameDir = mkdtempSync(join(tmpdir(), "waypoint-preview-frames-"));
const port = 9700 + Math.floor(Math.random() * 400);
const chromePath = process.env.CHROME_PATH ?? findChrome();
const ffmpegPath = process.env.FFMPEG_PATH ?? findFfmpeg();

mkdirSync(resolve(process.cwd(), "assets"), { recursive: true });

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
    "--hide-scrollbars",
    "--window-size=1440,930",
    "about:blank"
  ],
  { stdio: "ignore" }
);

try {
  const target = await waitForTarget(port);
  const cdp = await connectCdp(target.webSocketDebuggerUrl);

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 930,
    deviceScaleFactor: 1,
    mobile: false
  });
  await cdp.send("Page.navigate", { url: showcaseUrl });
  await cdp.waitForEvent("Page.loadEventFired", 10000);
  await delay(1000);

  const frames = [
    {
      name: "hero",
      setup: "window.scrollTo({ top: 0, behavior: 'instant' });"
    },
    {
      name: "problem",
      setup: "document.querySelector('#problem')?.scrollIntoView({ block: 'center', behavior: 'instant' });"
    },
    {
      name: "packet",
      setup:
        "document.querySelector('#packet')?.scrollIntoView({ block: 'center', behavior: 'instant' }); document.querySelector('[data-play]')?.click();"
    },
    {
      name: "receipts",
      setup: `
        document.querySelector('#receipts')?.scrollIntoView({ block: 'center', behavior: 'instant' });
        const buttons = [...document.querySelectorAll('[data-mod-list] button')];
        buttons[2]?.click();
      `
    },
    {
      name: "quality",
      setup: `
        document.querySelector('#quality')?.scrollIntoView({ block: 'center', behavior: 'instant' });
        document.querySelector('[data-run-detector]')?.click();
      `
    },
    {
      name: "under-hood",
      setup: "document.querySelector('#under-hood')?.scrollIntoView({ block: 'center', behavior: 'instant' });"
    }
  ];

  for (const [index, frame] of frames.entries()) {
    await evaluate(cdp, previewSetup(frame.setup));
    await delay(index === 2 ? 900 : 500);
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    writeFileSync(join(frameDir, `frame-${String(index + 1).padStart(2, "0")}.png`), Buffer.from(screenshot.data, "base64"));
    console.log(`captured ${frame.name}`);
  }

  const palettePath = join(frameDir, "palette.png");
  runFfmpeg([
    "-y",
    "-framerate",
    "1",
    "-i",
    join(frameDir, "frame-%02d.png"),
    "-vf",
    "scale=960:620:force_original_aspect_ratio=increase,crop=960:620,fps=1,palettegen=stats_mode=full",
    "-frames:v",
    "1",
    "-update",
    "1",
    palettePath
  ]);
  runFfmpeg([
    "-y",
    "-framerate",
    "1",
    "-i",
    join(frameDir, "frame-%02d.png"),
    "-i",
    palettePath,
    "-lavfi",
    "scale=960:620:force_original_aspect_ratio=increase,crop=960:620,fps=1[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3",
    "-loop",
    "0",
    outputPath
  ]);

  console.log(`wrote ${outputPath}`);
} finally {
  chrome.kill("SIGKILL");
  if (managedServer) managedServer.kill("SIGTERM");
  await delay(300);
  rmSync(frameDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
  rmSync(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
}

function previewSetup(setup) {
  return `(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    ${setup}
    return true;
  })()`;
}

function runFfmpeg(args) {
  const result = spawnSync(ffmpegPath, ["-v", "warning", ...args], {
    encoding: "utf8"
  });
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    process.stderr.write(result.stderr ?? "");
    throw new Error(`ffmpeg failed with status ${result.status}`);
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
    throw new Error("Vite is not installed. Run npm install before capturing the showcase preview.");
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
      const waiters = eventWaiters.get(payload.method) ?? [];
      for (const waiter of waiters.splice(0)) waiter(payload);
      eventWaiters.set(payload.method, waiters);
    }
  });

  return {
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

function findFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { stdio: "ignore", shell: false });
  if (probe.status === 0) return "ffmpeg";

  const candidates = [
    "C:/Users/Acer/scoop/shims/ffmpeg.exe",
    "C:/ProgramData/chocolatey/bin/ffmpeg.exe",
    "/usr/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/local/bin/ffmpeg"
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("ffmpeg was not found. Set FFMPEG_PATH to regenerate the README preview GIF.");
  return found;
}
