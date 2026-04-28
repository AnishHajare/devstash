"use client";

import { useEffect, useRef } from "react";

const CLOUDS = [
  {
    style: {
      "--x": "-12vw",
      "--start-y": "86vh",
      "--travel": "118vh",
      "--drift-x": "10vw",
      "--blur": "42px",
      "--scale": "1.08",
      "--base-opacity": "0.22",
      "--alpha-boost": "0.28",
      width: "46vw",
      height: "22vw",
      minWidth: 430,
      minHeight: 210,
      background: "rgba(255, 228, 241, 0.94)",
    } as React.CSSProperties,
  },
  {
    style: {
      "--x": "48vw",
      "--start-y": "72vh",
      "--travel": "104vh",
      "--drift-x": "-12vw",
      "--blur": "52px",
      "--scale": "1.18",
      "--base-opacity": "0.18",
      "--alpha-boost": "0.3",
      width: "54vw",
      height: "25vw",
      minWidth: 500,
      minHeight: 230,
      background: "rgba(251, 207, 232, 0.9)",
    } as React.CSSProperties,
  },
  {
    style: {
      "--x": "12vw",
      "--start-y": "122vh",
      "--travel": "142vh",
      "--drift-x": "18vw",
      "--blur": "58px",
      "--scale": "1.12",
      "--base-opacity": "0.12",
      "--alpha-boost": "0.24",
      width: "58vw",
      height: "28vw",
      minWidth: 520,
      minHeight: 250,
      background: "rgba(219, 234, 254, 0.86)",
    } as React.CSSProperties,
  },
  {
    style: {
      "--x": "62vw",
      "--start-y": "130vh",
      "--travel": "148vh",
      "--drift-x": "-18vw",
      "--blur": "48px",
      "--scale": "0.95",
      "--base-opacity": "0.1",
      "--alpha-boost": "0.22",
      width: "38vw",
      height: "18vw",
      minWidth: 360,
      minHeight: 170,
      background: "rgba(255, 237, 213, 0.58)",
    } as React.CSSProperties,
  },
  {
    style: {
      "--x": "-8vw",
      "--start-y": "164vh",
      "--travel": "170vh",
      "--drift-x": "22vw",
      "--blur": "62px",
      "--scale": "1.35",
      "--base-opacity": "0.08",
      "--alpha-boost": "0.2",
      width: "64vw",
      height: "30vw",
      minWidth: 560,
      minHeight: 260,
      background: "rgba(248, 250, 252, 0.86)",
    } as React.CSSProperties,
  },
  {
    style: {
      "--x": "36vw",
      "--start-y": "190vh",
      "--travel": "190vh",
      "--drift-x": "-8vw",
      "--blur": "70px",
      "--scale": "1.28",
      "--base-opacity": "0.08",
      "--alpha-boost": "0.18",
      width: "74vw",
      height: "34vw",
      minWidth: 640,
      minHeight: 290,
      background: "rgba(244, 231, 255, 0.72)",
    } as React.CSSProperties,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function CloudBackground() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const cursorState = useRef({
    x: 0,
    y: 0,
    tx: 0,
    ty: 0,
    scale: 1,
    targetScale: 1,
  });

  useEffect(() => {
    const state = cursorState.current;
    state.x = window.innerWidth * 0.5;
    state.y = window.innerHeight * 0.32;
    state.tx = state.x;
    state.ty = state.y;

    function updateCloudTravel() {
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      const progress = clamp(window.scrollY / maxScroll, 0, 1);
      const cloudAlpha = Math.sin(progress * Math.PI);
      document.documentElement.style.setProperty(
        "--scroll",
        progress.toFixed(4)
      );
      document.documentElement.style.setProperty(
        "--cloud-alpha",
        clamp(cloudAlpha, 0, 1).toFixed(4)
      );
    }

    let rafId: number;
    function animateCursor() {
      state.x += (state.tx - state.x) * 0.08;
      state.y += (state.ty - state.y) * 0.08;
      state.scale += (state.targetScale - state.scale) * 0.14;

      if (cursorRef.current) {
        cursorRef.current.style.setProperty("--x", `${state.x}px`);
        cursorRef.current.style.setProperty("--y", `${state.y}px`);
        cursorRef.current.style.transform = `scale(${state.scale})`;
      }
      rafId = requestAnimationFrame(animateCursor);
    }

    function onMouseMove(e: MouseEvent) {
      state.tx = e.clientX;
      state.ty = e.clientY;

      // Secondary glow follows cursor exactly (no lag)
      if (glowRef.current) {
        glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
        glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
      }

      // Gradient border reveal on .hoverable cards
      const cards = document.querySelectorAll<HTMLElement>(".hoverable");
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        card.style.setProperty("--mouse-x", `${cx}px`);
        card.style.setProperty("--mouse-y", `${cy}px`);
      });
    }

    function onMouseEnterInteractive() {
      state.targetScale = 1.15;
      if (cursorRef.current) cursorRef.current.style.opacity = "0.16";
      if (glowRef.current) glowRef.current.style.opacity = "0.22";
    }

    function onMouseLeaveInteractive() {
      state.targetScale = 1;
      if (cursorRef.current) cursorRef.current.style.opacity = "0.12";
      if (glowRef.current) glowRef.current.style.opacity = "0.16";
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("scroll", updateCloudTravel, { passive: true });
    window.addEventListener("resize", updateCloudTravel);

    const hoverTargets = document.querySelectorAll("a, button, .hoverable");
    hoverTargets.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnterInteractive);
      el.addEventListener("mouseleave", onMouseLeaveInteractive);
    });

    updateCloudTravel();
    rafId = requestAnimationFrame(animateCursor);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", updateCloudTravel);
      window.removeEventListener("resize", updateCloudTravel);
      cancelAnimationFrame(rafId);
      hoverTargets.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterInteractive);
        el.removeEventListener("mouseleave", onMouseLeaveInteractive);
      });
      document.documentElement.style.removeProperty("--scroll");
      document.documentElement.style.removeProperty("--cloud-alpha");
    };
  }, []);

  return (
    <>
      <div className="homepage-cloud-field" aria-hidden="true">
        {CLOUDS.map((cloud, i) => (
          <span key={i} className="homepage-cloud" style={cloud.style} />
        ))}
        <span className="homepage-cloud-haze" />
      </div>
      <div ref={cursorRef} className="homepage-cursor-light" aria-hidden="true" />
      <div ref={glowRef} className="homepage-cursor-glow" aria-hidden="true" />
    </>
  );
}
