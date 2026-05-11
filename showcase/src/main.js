import "./styles.css";
import { data } from "./generated-data.js";

const caseLabel = document.querySelector("[data-case-label]");
const teacherMode = document.querySelector("[data-teacher-mode]");
const standard = document.querySelector("[data-standard]");
const qualityChip = document.querySelector("[data-quality-chip]");
const packetTitle = document.querySelector("[data-packet-title]");
const handoutSections = document.querySelector("[data-handout-sections]");
const modList = document.querySelector("[data-mod-list]");
const receiptDetail = document.querySelector("[data-receipt-detail]");
const qualityGrid = document.querySelector("[data-quality-grid]");
const architecture = document.querySelector("[data-architecture]");

caseLabel.textContent = data.packet.caseLabel;
teacherMode.textContent = data.packet.teacherMode;
standard.textContent = data.packet.preservedStandard;
qualityChip.textContent = data.packet.qualityReport.passed ? "Quality passed" : "Needs review";
packetTitle.textContent = data.packet.teacherMode;

renderHandout();
renderRecommendations();
renderQuality();
renderArchitecture();
wireScrollButtons();
wireReveal();
startAmbientCanvas();

function renderHandout() {
  const sections = [
    {
      title: "Before Class",
      items: data.packet.useFirst
    },
    {
      title: "Materials That Actually Match",
      items: data.miniMaterials.slice(0, 5).map((material) => material.name)
    },
    {
      title: "Tomorrow's Checks",
      items: [
        "Central idea answer still targets RI.7.2.",
        "Every recommendation has IEP, lesson, and UDL evidence.",
        "Student-facing text keeps adult labels out of the room."
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
    tag(`Time: ${modification.timeCost}`)
  );

  const grid = document.createElement("div");
  grid.className = "trace-grid";
  grid.append(
    traceBox("IEP quote", trace.iepQuote),
    traceBox("Lesson demand", trace.lessonDemand),
    traceBox("UDL alignment", trace.udlAlignment.map((item) => `${item.principle}: ${item.why}`).join(" ")),
    traceBox("Progress check", trace.progressCheck)
  );

  const studentText = document.createElement("div");
  studentText.className = "trace-box";
  const studentTitle = document.createElement("strong");
  studentTitle.textContent = "Student-facing text";
  const studentCopy = document.createElement("p");
  studentCopy.textContent = modification.studentFacingText;
  studentText.append(studentTitle, studentCopy);

  const barrier = document.createElement("div");
  barrier.className = "trace-box";
  const barrierTitle = document.createElement("strong");
  barrierTitle.textContent = "Barrier addressed";
  const barrierCopy = document.createElement("p");
  barrierCopy.textContent = trace.barrierAddressed;
  barrier.append(barrierTitle, barrierCopy);

  grid.append(studentText, barrier);
  receiptDetail.replaceChildren(title, action, tags, grid);
}

function renderQuality() {
  const checks = [
    ["vagueAdvice", "Specific teacher actions", "No support-as-needed soup."],
    ["missingEvidence", "Evidence refs resolve", "IEP, lesson, and UDL all show up."],
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
  architecture.replaceChildren(
    ...data.architecture.map((item, index) => {
      const [title, copy] = item.split(": ");
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

  const dots = Array.from({ length: 18 }, (_, index) => ({
    x: (index * 173) % 1000,
    y: (index * 97) % 700,
    radius: 70 + (index % 4) * 28,
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
    context.fillStyle = "#fff8ed";
    context.fillRect(0, 0, width, height);

    for (const dot of dots) {
      const x = (dot.x + Math.sin(tick * 0.006 + dot.radius) * 34) % (width + 180);
      const y = (dot.y + Math.cos(tick * 0.004 + dot.radius) * 30) % (height + 180);
      const gradient = context.createRadialGradient(x, y, 0, x, y, dot.radius);
      gradient.addColorStop(0, `${dot.hue}22`);
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
