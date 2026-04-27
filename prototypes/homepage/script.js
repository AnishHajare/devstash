const cursorLight = document.querySelector(".cursor-light");
const typingTarget = document.querySelector("[data-typing]");

const cursor = {
  x: window.innerWidth * 0.5,
  y: window.innerHeight * 0.32,
  tx: window.innerWidth * 0.5,
  ty: window.innerHeight * 0.32,
  scale: 1,
  targetScale: 1,
};

const typedLines = [
  "result.explanation",
  "// Explains the saved snippet in plain language",
  "// and suggests tags for faster retrieval.",
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateCloudTravel() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maxScroll, 0, 1);
  const cloudAlpha = Math.sin(progress * Math.PI);

  document.documentElement.style.setProperty("--scroll", progress.toFixed(4));
  document.documentElement.style.setProperty("--cloud-alpha", clamp(cloudAlpha, 0, 1).toFixed(4));
}

function animateCursor() {
  cursor.x += (cursor.tx - cursor.x) * 0.12;
  cursor.y += (cursor.ty - cursor.y) * 0.12;
  cursor.scale += (cursor.targetScale - cursor.scale) * 0.14;

  if (cursorLight) {
    cursorLight.style.setProperty("--x", `${cursor.x}px`);
    cursorLight.style.setProperty("--y", `${cursor.y}px`);
    cursorLight.style.transform = `scale(${cursor.scale})`;
  }

  requestAnimationFrame(animateCursor);
}

function setupReveal() {
  const revealItems = document.querySelectorAll(".reveal");

  revealItems.forEach((item) => {
    const delay = item.getAttribute("data-delay");
    if (delay) item.style.setProperty("--delay", `${delay}ms`);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -4% 0px", threshold: 0.08 },
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupTyping() {
  if (!typingTarget) return;

  const text = typedLines.join("\n");
  let index = 0;

  function type() {
    typingTarget.textContent = text.slice(0, index);
    index = (index + 1) % (text.length + 52);
    window.setTimeout(type, index > text.length ? 42 : 34);
  }

  type();
}

function setupHoverTargets() {
  const targets = document.querySelectorAll("a, button, .hoverable");

  targets.forEach((target) => {
    target.addEventListener("mouseenter", () => {
      cursor.targetScale = 1.08;
      cursorLight?.style.setProperty("opacity", "1");
    });
    target.addEventListener("mouseleave", () => {
      cursor.targetScale = 1;
      cursorLight?.style.setProperty("opacity", "0.9");
    });
  });
}

window.addEventListener("mousemove", (event) => {
  cursor.tx = event.clientX;
  cursor.ty = event.clientY;
});

window.addEventListener(
  "scroll",
  () => {
    updateCloudTravel();
  },
  { passive: true },
);

window.addEventListener("resize", updateCloudTravel);

updateCloudTravel();
setupReveal();
setupTyping();
setupHoverTargets();
animateCursor();
