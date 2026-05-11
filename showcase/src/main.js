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
const sceneCount = document.querySelector("[data-scene-count]");
const sceneTitle = document.querySelector("[data-scene-title]");
const sceneCopy = document.querySelector("[data-scene-copy]");
const sceneStrip = document.querySelector("[data-scene-strip]");
const playButton = document.querySelector("[data-play]");
const standard = document.querySelector("[data-standard]");
const qualityChip = document.querySelector("[data-quality-chip]");
const packetTitle = document.querySelector("[data-packet-title]");
const handoutSections = document.querySelector("[data-handout-sections]");
const modList = document.querySelector("[data-mod-list]");
const receiptDetail = document.querySelector("[data-receipt-detail]");
const qualityGrid = document.querySelector("[data-quality-grid]");
const architecture = document.querySelector("[data-architecture]");
const detectorButton = document.querySelector("[data-run-detector]");
const detectorOutput = document.querySelector("[data-detector-output]");

let currentScene = 0;
let playTimer = null;

standard.textContent = data.packet.preservedStandard;
qualityChip.textContent = data.packet.qualityReport.passed ? "Quality passed" : "Needs review";
packetTitle.textContent = data.packet.teacherMode;

renderSceneStrip();
renderHandout();
renderRecommendations();
renderQuality();
renderArchitecture();
wireDetector();
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
