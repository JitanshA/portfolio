"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TelescopeScene3D } from "./telescope-scene-3d";
import { HERO_VIEW, LAUNCH_POINT, type ChartPoint3D, type SpaceState } from "./hero-space";

// Five celestial destinations mapped onto the page's section anchors. One
// source of truth for both the SVG geometry and the accessible links.
type Dest = {
  id: string;
  href: string;
  label: string;
  caption: string;
  x: number;
  y: number;
  r: number;
  featured?: boolean;
  far?: boolean;
  labelSide?: "left" | "right";
};

const VB = { w: HERO_VIEW.width, h: HERO_VIEW.height };
// SVG fallback controller coordinates. The Three.js scene calculates
// its hinge position independently from the loaded GLB model.
const ELEVATION_AXIS = { x: 250, y: 500 };
const AIM_ORIGIN = { x: 70, y: 500 };
const LAUNCH_SITE = { x: 330, y: 620 };
const REST_DEG = -30;
const MIN_DEG = -52;
const MAX_DEG = -6;

// An asymmetric sky chart rather than a ring of controls. Size and luminance
// make Projects feel nearest while Stack and Research recede.
const DESTS: Dest[] = [
  { id: "about", href: "#about", label: "About", caption: "Get to know me", x: 452, y: 118, r: 17 },
  { id: "experience", href: "#experience", label: "Experience", caption: "Where I've worked", x: 672, y: 168, r: 18 },
  { id: "projects", href: "#projects", label: "Projects", caption: "Things I've built", x: 704, y: 318, r: 25, featured: true },
  { id: "research", href: "#research", label: "Research", caption: "Exploring new ideas", x: 620, y: 455, r: 17, far: true },
  { id: "stack", href: "#skills", label: "Stack", caption: "Tools I use", x: 430, y: 262, r: 15, far: true, labelSide: "left" },
];

const rad = (deg: number) => (deg * Math.PI) / 180;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
// exponential smoothing independent of frame-rate
const damp = (cur: number, target: number, lambda: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-lambda * dt));

// Deterministic, layered starfield. A restrained diagonal concentration ties
// the observatory to the destinations without becoming a particle effect.
type Star = { x: number; y: number; r: number; o: number; layer: 0 | 1 | 2; tw: boolean };
function makeStars(): Star[] {
  let s = 0x1234;
  const rng = () => { s = (Math.imul(s ^ (s >>> 15), 0x2c9277b5) + 0x1) >>> 0; return s / 4294967296; };
  const out: Star[] = [];
  const push = (n: number, layer: 0 | 1 | 2, rMin: number, rMax: number, oMin: number, oMax: number, twChance: number) => {
    for (let i = 0; i < n; i++) {
      const cluster = rng() < 0.34;
      const x = cluster ? 585 + (rng() - 0.5) * 430 : rng() * VB.w;
      const y = cluster ? 280 + (rng() - 0.5) * 360 : rng() * VB.h;
      out.push({ x: Math.max(4, Math.min(VB.w - 4, x)), y: Math.max(4, Math.min(VB.h - 4, y)), r: rMin + rng() * (rMax - rMin), o: oMin + rng() * (oMax - oMin), layer, tw: rng() < twChance });
    }
  };
  push(58, 0, 0.3, 0.65, 0.07, 0.22, 0);
  push(28, 1, 0.55, 1.05, 0.22, 0.5, 0.1);
  push(9, 2, 1.05, 1.65, 0.52, 0.88, 0.35);
  // Quiet, static points in the open sky between the dish and destinations.
  // Retry positions that would land on the model or crowd a destination's
  // label/hit area.
  for (let i = 0; i < 28; i++) {
    const x = 260 + rng() * 390;
    const y = 140 + rng() * 365;
    if ((x < 390 && y > 300) || DESTS.some((dest) => Math.hypot(x - dest.x, y - dest.y) < dest.r + 35)) {
      i--;
      continue;
    }
    const bright = i >= 24;
    out.push({ x, y, r: bright ? 1 + rng() * 0.25 : 0.4 + rng() * 0.5,
      o: bright ? 0.4 + rng() * 0.15 : 0.12 + rng() * 0.2, layer: bright ? 1 : 0, tw: false });
  }
  return out;
}

// cubic Bézier point + tangent angle (deg)
function bezier(p0: P, p1: P, p2: P, p3: P, t: number) {
  const u = 1 - t;
  const b0 = u * u * u, b1 = 3 * u * u * t, b2 = 3 * u * t * t, b3 = t * t * t;
  const x = b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x;
  const y = b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y;
  const d0 = 3 * u * u, d1 = 6 * u * t, d2 = 3 * t * t;
  const dx = d0 * (p1.x - p0.x) + d1 * (p2.x - p1.x) + d2 * (p3.x - p2.x);
  const dy = d0 * (p1.y - p0.y) + d1 * (p2.y - p1.y) + d2 * (p3.y - p2.y);
  return { x, y, deg: (Math.atan2(dy, dx) * 180) / Math.PI };
}
type P = { x: number; y: number };

type Phase = "idle" | "launching" | "scrolling";
type SceneState = "checking" | "loading" | "ready" | "lost" | "failed";

const STAR_FIELD = makeStars();

function TelescopeScene() {
  const rootRef = useRef<HTMLDivElement>(null);
  const launchAnchorRef = useRef<(() => ChartPoint3D | null) | null>(null);
  const spaceRef = useRef<SpaceState>({ activeId: null, aim: null, flight: null });
  const [sceneActive, setSceneActive] = useState(true);
  const [sceneState, setSceneState] = useState<SceneState>("checking");
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    let supported = false;
    try {
      const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
      supported = !!context;
      context?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      // Browser or policy-level WebGL failures use the static observatory.
    }
    const check = requestAnimationFrame(() => setSceneState(supported ? "loading" : "failed"));
    return () => cancelAnimationFrame(check);
  }, []);

  const sceneLoading = sceneState === "checking" || sceneState === "loading";
  const sceneFallback = sceneState === "lost" || sceneState === "failed";
  const sceneInteractive = sceneState === "ready";
  const handleSceneReady = useCallback(() => {
    setSceneState((current) => current === "failed" || current === "lost" ? current : "ready");
  }, []);
  const handleSceneUnavailable = useCallback(() => setSceneState("failed"), []);
  const handleContextLost = useCallback(() => setSceneState("lost"), []);
  const handleContextRestored = useCallback((modelReady: boolean) => {
    setSceneState(modelReady ? "ready" : "loading");
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const svg = root.querySelector<SVGSVGElement>("svg.telescope-svg");
    const dish = root.querySelector<SVGGElement>(".tsc-dish-assembly");
    const rocket = root.querySelector<SVGGElement>(".tsc-rocket");
    const trail = root.querySelector<SVGPathElement>(".tsc-trail");
    const guide = root.querySelector<HTMLDivElement>(".tsc-guide");
    const anchors = Array.from(root.querySelectorAll<SVGAElement>("a.tsc-node"));
    if (!svg || !dish || !rocket || !trail || !guide) return;

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    // ---- shared state ----
    let phase: Phase = "idle";
    let angle = REST_DEG; // current telescope angle (hidden SVG dish + rocket curve)
    let targetAngle = REST_DEG;
    let hovered: Dest | null = null;
    let pointerPt: P | null = null; // raw SVG-space point, or null
    let raf = 0;
    let last = performance.now();
    let visible = true;

    // flight state
    let flight: { p0: ChartPoint3D; p1: P; p2: P; p3: P; t: number; dest: Dest } | null = null;
    const trailPts: P[] = [];
    let cleanupScroll: (() => void) | null = null;
    let scrollSafety = 0;

    const setActiveNode = (dest: Dest | null) => {
      spaceRef.current.activeId = dest?.id ?? null;
      for (const a of anchors) a.classList.toggle("is-active", !!dest && a.dataset.id === dest.id);
    };
    const setArrived = (dest: Dest | null) => {
      for (const a of anchors) a.classList.toggle("is-arrived", !!dest && a.dataset.id === dest.id);
    };

    const clientToSvg = (cx: number, cy: number) => {
      const rect = svg.getBoundingClientRect();
      return { x: ((cx - rect.left) / rect.width) * VB.w, y: ((cy - rect.top) / rect.height) * VB.h };
    };

    const aimTo = (pt: P) => {
      const d = (Math.atan2(pt.y - AIM_ORIGIN.y, pt.x - AIM_ORIGIN.x) * 180) / Math.PI;
      return clamp(d, MIN_DEG, MAX_DEG);
    };

    const applyDish = () => {
      dish.setAttribute("transform", `rotate(${angle.toFixed(2)} ${ELEVATION_AXIS.x} ${ELEVATION_AXIS.y})`);
    };

    // ---- reduced motion: static scene, native navigation ----
    if (reducedMotion || !sceneInteractive) {
      angle = REST_DEG;
      applyDish();
      return () => {};
    }

    // ---- pointer + focus aiming ----
    const onPointerMove = (e: PointerEvent) => {
      if (!finePointer || phase === "launching" || phase === "scrolling") return;
      pointerPt = clientToSvg(e.clientX, e.clientY);
    };
    const onPointerLeave = () => { pointerPt = null; };
    root.addEventListener("pointermove", onPointerMove);
    root.addEventListener("pointerleave", onPointerLeave);

    const onEnter = (dest: Dest) => () => {
      if (phase === "launching" || phase === "scrolling") return;
      hovered = dest;
      setActiveNode(dest);
    };
    const onLeaveNode = (dest: Dest) => () => {
      if (hovered?.id === dest.id) { hovered = null; if (phase !== "launching" && phase !== "scrolling") setActiveNode(null); }
    };

    // ---- launch sequence ----
    const startFlight = (dest: Dest) => {
      if (phase === "scrolling") window.scrollTo({ top: window.scrollY, behavior: "instant" });
      cancelScroll();
      phase = "launching";
      hovered = dest;
      setActiveNode(dest);
      setArrived(null);
      const p0 = launchAnchorRef.current?.();
      // Navigation stays available while the GLB is loading, without inventing
      // a detached launch point when its physical receiver is not ready yet.
      if (!p0) { beginScroll(dest); return; }
      targetAngle = aimTo({ x: dest.x, y: dest.y });
      const dir = rad(targetAngle);
      const dist = Math.hypot(dest.x - p0.x, dest.y - p0.y);
      // Shape the Bézier path into an upward arc from the live receiver pose.
      const p1 = { x: p0.x + 24, y: p0.y - Math.min(150, dist * 0.42) };
      const p2 = { x: dest.x - Math.cos(dir) * dist * 0.18 - 26, y: dest.y - Math.sin(dir) * dist * 0.1 - 22 };
      flight = { p0, p1, p2, p3: { x: dest.x, y: dest.y }, t: 0, dest };
      spaceRef.current.flight = { ...flight, progress: 0 };
      trailPts.length = 0;
      trail.setAttribute("d", "");
      rocket.setAttribute("transform", `translate(${p0.x} ${p0.y}) rotate(-10)`);
      rocket.classList.add("is-flying");
    };

    const onClick = (dest: Dest) => (e: Event) => {
      e.preventDefault();
      startFlight(dest);
    };

    const removeAnchorListeners: (() => void)[] = [];
    for (const a of anchors) {
      const dest = DESTS.find((d) => d.id === a.dataset.id)!;
      const handlers = { pointerenter: onEnter(dest), pointerleave: onLeaveNode(dest), focus: onEnter(dest), blur: onLeaveNode(dest), click: onClick(dest) };
      for (const [event, handler] of Object.entries(handlers)) {
        a.addEventListener(event, handler);
        removeAnchorListeners.push(() => a.removeEventListener(event, handler));
      }
    }

    // ---- arrival → scroll guidance synced to real scroll position ----
    const beginScroll = (dest: Dest) => {
      phase = "scrolling";
      spaceRef.current.flight = null;
      rocket.classList.remove("is-flying");
      // The Stack destination intentionally maps to the existing #skills
      // section, so resolve the canonical href rather than the visual node id.
      const section = document.getElementById(dest.href.slice(1));
      if (!section) { finishScroll(); return; }
      const headerH = 88;
      const startY = window.scrollY;
      const rectTop = section.getBoundingClientRect().top + window.scrollY;
      const maxY = document.documentElement.scrollHeight - window.innerHeight;
      const targetY = clamp(rectTop - headerH, 0, maxY);
      history.pushState(null, "", dest.href);

      guide.classList.add("is-on");
      const vh = window.innerHeight;
      let rafG = 0;
      const update = () => {
        rafG = 0;
        const denom = targetY - startY;
        const prog = denom === 0 ? 1 : clamp((window.scrollY - startY) / denom, 0, 1);
        // guide rides from ~18% to ~78% of viewport height as we approach
        guide.style.top = `${(0.18 + prog * 0.6) * vh}px`;
        if (prog >= 0.995) finishScroll();
      };
      const onScroll = () => { if (!rafG) rafG = requestAnimationFrame(update); };
      window.addEventListener("scroll", onScroll, { passive: true });
      cleanupScroll = () => {
        window.removeEventListener("scroll", onScroll);
        if (rafG) cancelAnimationFrame(rafG);
        guide.classList.remove("is-on");
      };
      // native smooth scroll (respects html scroll-padding-top); rocket tracks it
      window.scrollTo({ top: targetY, behavior: "smooth" });
      update();
      // safety: if scroll is interrupted / never completes, end gracefully
      scrollSafety = window.setTimeout(() => finishScroll(), 2600);
    };

    const finishScroll = () => {
      if (phase !== "scrolling") return;
      cancelScroll();
      setArrived(null);
      setActiveNode(null);
      hovered = null;
      phase = "idle";
    };

    function cancelScroll() {
      if (scrollSafety) { clearTimeout(scrollSafety); scrollSafety = 0; }
      if (cleanupScroll) { cleanupScroll(); cleanupScroll = null; }
    }

    const cancelNavigation = () => {
      if (phase === "idle") return;
      if (phase === "scrolling") window.scrollTo({ top: window.scrollY, behavior: "instant" });
      cancelScroll();
      flight = null;
      spaceRef.current.flight = null;
      rocket.classList.remove("is-flying");
      trail.setAttribute("d", "");
      hovered = null;
      pointerPt = null;
      phase = "idle";
      setActiveNode(null);
      setArrived(null);
    };
    const onNavigationKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") cancelNavigation();
    };
    window.addEventListener("keydown", onNavigationKey);
    window.addEventListener("wheel", cancelNavigation, { passive: true });
    window.addEventListener("touchstart", cancelNavigation, { passive: true });

    // ---- main loop (aim + rocket flight) ----
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      // choose aim target: flight > hovered node > pointer > rest
      const aimPt: P | null = phase === "launching" && flight ? flight.dest : hovered ? { x: hovered.x, y: hovered.y } : pointerPt;
      spaceRef.current.aim = aimPt;

      targetAngle = aimPt ? aimTo(aimPt) : REST_DEG;
      angle = damp(angle, targetAngle, 9, dt);
      applyDish();


      if (phase === "launching" && flight) {
        flight.t = Math.min(1, flight.t + dt / 1.65);
        const e = flight.t < 0.5 ? 2 * flight.t * flight.t : 1 - Math.pow(-2 * flight.t + 2, 2) / 2;
        if (spaceRef.current.flight) spaceRef.current.flight.progress = e;
        const b = bezier(flight.p0, flight.p1, flight.p2, flight.p3, e);
        rocket.setAttribute("transform", `translate(${b.x.toFixed(2)} ${b.y.toFixed(2)}) rotate(${(b.deg + 90).toFixed(2)})`);
        trailPts.push({ x: b.x, y: b.y });
        if (trailPts.length > 14) trailPts.shift();
        trail.setAttribute("d", trailPts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" "));
        if (flight.t >= 1) {
          const dest = flight.dest;
          flight = null;
          rocket.classList.remove("is-flying");
          trail.setAttribute("d", "");
          setArrived(dest); // brief pulse
          beginScroll(dest);
        }
      }
    };

    // ---- visibility gating ----
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      setSceneActive(visible && !document.hidden);
      if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
      else if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.01 });
    io.observe(root);
    const onDocHidden = () => {
      setSceneActive(visible && !document.hidden);
      if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
      else if (!document.hidden && visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
    };
    document.addEventListener("visibilitychange", onDocHidden);

    applyDish();
    raf = requestAnimationFrame(tick);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      cancelScroll();
      io.disconnect();
      document.removeEventListener("visibilitychange", onDocHidden);
      root.removeEventListener("pointermove", onPointerMove);
      root.removeEventListener("pointerleave", onPointerLeave);
      removeAnchorListeners.forEach((remove) => remove());
      window.removeEventListener("keydown", onNavigationKey);
      window.removeEventListener("wheel", cancelNavigation);
      window.removeEventListener("touchstart", cancelNavigation);
      setActiveNode(null);
      setArrived(null);
      spaceRef.current = { activeId: null, aim: null, flight: null };
    };
  }, [reducedMotion, sceneInteractive]);

  return (
    <div className={`telescope-hero${sceneLoading ? " is-scene-loading" : ""}${sceneFallback ? " is-scene-fallback" : ""}`} data-scene-state={sceneState} ref={rootRef} role="navigation" aria-label="Explore portfolio sections">
      {sceneState !== "checking" && sceneState !== "failed" && (
        <TelescopeScene3D
          state={spaceRef}
          launchAnchorRef={launchAnchorRef}
          destinations={DESTS}
          active={sceneActive && !reducedMotion && sceneInteractive}
          onReady={handleSceneReady}
          onUnavailable={handleSceneUnavailable}
          onContextLost={handleContextLost}
          onContextRestored={handleContextRestored}
        />
      )}
      <svg className="telescope-svg" viewBox={`0 0 ${VB.w} ${VB.h}`} aria-hidden="false">
        <defs>
          <linearGradient id="tsc-dish-shell" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#526d83" />
            <stop offset=".22" stopColor="#2b4358" />
            <stop offset=".62" stopColor="#111f2d" />
            <stop offset="1" stopColor="#050b12" />
          </linearGradient>
          <radialGradient id="tsc-dish-interior" cx="76%" cy="34%" r="82%">
            <stop offset="0" stopColor="#34546b" />
            <stop offset=".38" stopColor="#1b3042" />
            <stop offset=".76" stopColor="#0b1722" />
            <stop offset="1" stopColor="#040a11" />
          </radialGradient>
          <linearGradient id="tsc-mount" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a566b" />
            <stop offset=".48" stopColor="#172b3b" />
            <stop offset="1" stopColor="#07111a" />
          </linearGradient>
          <radialGradient id="tsc-collar" cx="35%" cy="28%" r="78%">
            <stop offset="0" stopColor="#dcf0fb" />
            <stop offset=".35" stopColor="#7fa8c4" />
            <stop offset=".7" stopColor="#32546b" />
            <stop offset="1" stopColor="#0e1c28" />
          </radialGradient>
          <radialGradient id="tsc-haze">
            <stop offset="0" stopColor="#173d5d" stopOpacity=".34" />
            <stop offset=".56" stopColor="#0d2740" stopOpacity=".12" />
            <stop offset="1" stopColor="#07101d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="tsc-rocket-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6faff" />
            <stop offset="1" stopColor="#bfd0e0" />
          </linearGradient>
          <filter id="tsc-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="tsc-soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>

        <ellipse className="tsc-haze-el" cx="610" cy="286" rx="330" ry="238" filter="url(#tsc-soft)" />

        {/* layered starfield */}
        <g className="tsc-stars" aria-hidden="true">
          {STAR_FIELD.map((s, i) => (
            <circle
              key={i}
              className={`tsc-star l${s.layer}${s.tw ? " tw" : ""}`}
              cx={s.x}
              cy={s.y}
              r={s.r}
              opacity={s.o}
              style={s.tw ? { animationDelay: `${((i % 6) * 0.9).toFixed(1)}s` } : undefined}
            />
          ))}
        </g>

        {/* A sparse navigational chart lives behind the bodies. */}
        <g className="tsc-links" aria-hidden="true" fill="none">
          <path d={`M${DESTS[0].x} ${DESTS[0].y} C 515 92 605 114 ${DESTS[1].x} ${DESTS[1].y}`} />
          <path d={`M${DESTS[1].x} ${DESTS[1].y} C 720 214 726 260 ${DESTS[2].x} ${DESTS[2].y}`} />
          <path d={`M${DESTS[2].x} ${DESTS[2].y} C 704 382 669 418 ${DESTS[3].x} ${DESTS[3].y}`} />
          <path d={`M${DESTS[3].x} ${DESTS[3].y} C 548 484 470 440 ${DESTS[4].x} ${DESTS[4].y}`} />
        </g>

        <g className="tsc-observatory" transform="translate(-225 -90) scale(1.18)">
        <ellipse className="tsc-ground-shadow" cx="250" cy="658" rx="100" ry="14" aria-hidden="true" />

        {/* The reflector, feed strut, receiver and bearing collar form one rigid
            elevation assembly. The collar is centred exactly on ELEVATION_AXIS so
            it stays visually seated inside the stationary housing at any angle. */}
        <g className="tsc-dish-assembly" transform={`rotate(${REST_DEG} ${ELEVATION_AXIS.x} ${ELEVATION_AXIS.y})`}>
          {/* The dish reads as a true 3/4-view ellipse: a broad outer rim, a
              smaller inner bowl offset toward the far edge (thin far rim, thick
              near rim — the standard concave-in-perspective cue), and a slightly
              larger back shell peeking out behind for shell thickness. The whole
              dish sits with its centre on the same horizontal line as the
              elevation axis so the unrotated boresight still points along +x,
              matching the aiming controller's convention. */}
          <ellipse className="tsc-dish-shell-back" cx="345" cy="508" rx="146" ry="91" />
          <ellipse className="tsc-dish-shell" cx="340" cy="500" rx="140" ry="86" />
          <ellipse className="tsc-dish-interior" cx="340" cy="470" rx="110" ry="46" />
          <path className="tsc-dish-rim" d="M208.4 470.6 A140 86 0 0 1 471.6 470.6" />
          {/* Three tapered struts anchored on the rim converge on the receiver,
              spanning visibly across the bowl instead of floating beside it. */}
          <path className="tsc-feed-strut" d="M207 467 L209 475 L340 447 L340 443 Z" />
          <path className="tsc-feed-strut" d="M473 467 L471 475 L340 447 L340 443 Z" />
          <path className="tsc-feed-strut" d="M312 584 L320 586 L342 445 L338 445 Z" />
          <path className="tsc-receiver-body" d="M333 445 L333 428 Q333 420 340 420 Q347 420 347 428 L347 445 Z" />
          <circle className="tsc-receiver-aperture" cx="340" cy="447" r="5" />
          <circle className="tsc-collar" cx={ELEVATION_AXIS.x} cy={ELEVATION_AXIS.y} r="19" />
          <line className="tsc-collar-key" x1={ELEVATION_AXIS.x} y1={ELEVATION_AXIS.y - 8} x2={ELEVATION_AXIS.x} y2={ELEVATION_AXIS.y - 16} />
        </g>

        {/* The bearing housing, yoke, pedestal and base stay stationary and are
            drawn after the dish so the housing always overlaps the collar. */}
        <g className="tsc-radio-mount" aria-hidden="true">
          <path className="tsc-yoke-saddle" d="M208 486 Q250 476 292 486 L292 494 Q250 484 208 494 Z" />
          <path className="tsc-yoke-arm" d="M206 548 L230 548 L222 488 L210 488 Z" />
          <path className="tsc-yoke-arm" d="M270 548 L294 548 L290 488 L278 488 Z" />
          <circle className="tsc-housing" cx={ELEVATION_AXIS.x} cy={ELEVATION_AXIS.y} r="30" />
          <circle className="tsc-housing-bore" cx={ELEVATION_AXIS.x} cy={ELEVATION_AXIS.y} r="22" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <circle
              key={deg}
              className="tsc-housing-bolt"
              cx={ELEVATION_AXIS.x + Math.cos(rad(deg)) * 26}
              cy={ELEVATION_AXIS.y + Math.sin(rad(deg)) * 26}
              r="1.6"
            />
          ))}
          <ellipse className="tsc-azimuth-deck" cx="250" cy="552" rx="58" ry="15" />
          <path className="tsc-column" d="M222 552 C226 572 234 580 234 588 C234 596 226 608 220 620 L280 620 C274 608 266 596 266 588 C266 580 274 572 278 552 Z" />
          <line className="tsc-column-seam" x1="250" y1="560" x2="250" y2="612" />
          <path className="tsc-column-band" d="M225 568 H275 V572 H225 Z" />
          <path className="tsc-column-band" d="M223 598 H277 V602 H223 Z" />
          <path className="tsc-brace" d="M225 618 L214 618 L232 578 L238 578 Z" />
          <path className="tsc-brace" d="M275 618 L286 618 L268 578 L262 578 Z" />
          <path className="tsc-base" d="M205 620 L295 620 L318 648 H182 Z" />
          <path className="tsc-base-top" d="M212 620 H288 L300 630 H200 Z" />
          {[196, 210, 290, 304].map((x) => (
            <circle key={x} className="tsc-base-foot" cx={x} cy={644} r="2.2" />
          ))}
        </g>

        {/* A small observatory service pad supplies the rocket launch origin. */}
        <g className="tsc-launch-pad" aria-hidden="true">
          <path d="M313 633 H347 L356 640 H304 Z" />
          <path d="M325 633 V616 H336 V633" />
          <circle cx={LAUNCH_SITE.x} cy={LAUNCH_SITE.y} r="3" />
        </g>
        </g>

        {/* destinations */}
        {DESTS.map((d) => (
          <a key={d.id} className={`tsc-node${d.featured ? " is-featured" : ""}${d.far ? " is-far" : ""}`} href={d.href} data-id={d.id} aria-label={`${d.label} — ${d.caption}`}>
            <circle className="tsc-hit" cx={d.x} cy={d.y} r={d.r + 22} />
            <circle className="tsc-ring" cx={d.x} cy={d.y} r={d.r + 11} />
            <g className="tsc-ticks">
              <line x1={d.x} y1={d.y - d.r - 11} x2={d.x} y2={d.y - d.r - 15} />
              <line x1={d.x + d.r + 11} y1={d.y} x2={d.x + d.r + 15} y2={d.y} />
            </g>
            <circle className="tsc-orbit-dot" cx={d.x + (d.r + 11) * 0.7} cy={d.y - (d.r + 11) * 0.7} r={2.1} />
            <circle className="tsc-pulse" cx={d.x} cy={d.y} r={d.r} />
            <text className="tsc-label" textAnchor={d.labelSide === "left" ? "end" : "start"} x={d.labelSide === "left" ? d.x - d.r - 20 : d.x + d.r + 20} y={d.y - 3}>{d.label.toUpperCase()}</text>
            <text className="tsc-caption" textAnchor={d.labelSide === "left" ? "end" : "start"} x={d.labelSide === "left" ? d.x - d.r - 20 : d.x + d.r + 20} y={d.y + 15}>{d.caption}</text>
          </a>
        ))}

        {/* rocket (hidden until launch) */}
        <path className="tsc-trail" d="" aria-hidden="true" />
        <g className="tsc-rocket" transform={`translate(${LAUNCH_POINT.x} ${LAUNCH_POINT.y})`} aria-hidden="true">
          <path className="tsc-rocket-flame" d="M-2.6 8 Q0 20 2.6 8 Q0 11 -2.6 8 Z" />
          <path className="tsc-rocket-body" d="M0 -15 C 4.6 -9 5.4 -1 4.6 8 L -4.6 8 C -5.4 -1 -4.6 -9 0 -15 Z" fill="url(#tsc-rocket-body)" />
          <path className="tsc-rocket-edge" d="M0 -15 C 4.6 -9 5.4 -1 4.6 8" />
          <path className="tsc-rocket-fin" d="M-4.6 3 L-9 11 L-4.6 8 Z" />
          <path className="tsc-rocket-fin" d="M4.6 3 L9 11 L4.6 8 Z" />
          <circle className="tsc-rocket-window" cx="0" cy="-4" r="2.2" />
        </g>
      </svg>

      <div className="tsc-guide" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path d="M12 1 C 16 6 17 13 16 19 L 8 19 C 7 13 8 6 12 1 Z" fill="#eef6ff" />
          <path d="M8 15 L4 21 L8 18 Z" fill="#9fc7e8" />
          <path d="M16 15 L20 21 L16 18 Z" fill="#9fc7e8" />
          <circle cx="12" cy="9" r="2.4" fill="#0b1420" />
        </svg>
      </div>
    </div>
  );
}

export function TelescopeHero() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1101px)");
    const sync = () => setEnabled(desktop.matches);
    sync();
    desktop.addEventListener("change", sync);
    return () => desktop.removeEventListener("change", sync);
  }, []);

  // When the hero collapses toward tablet/mobile dimensions, the SVG,
  // animation loop and navigation listeners are never mounted. The ordinary
  // header and document anchors remain available.
  return enabled ? <TelescopeScene /> : null;
}
