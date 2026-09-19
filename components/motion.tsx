"use client";

import { useEffect, useState } from "react";

const NAME_TYPING_MS = 75;
const CARET_SETTLE_MS = 850;
const TAGLINE_START_DELAY_MS = 400;
const TAGLINE_TYPING_MS = 65;
const TAGLINE_DELETE_MS = 38;
const TAGLINE_HOLD_MS = 3000;
const TAGLINE_BETWEEN_MS = 220;
const TAGLINE_ENDINGS = [
  "at the systems layer.",
  "for scale.",
  "for reliability.",
  "the next idea.",
] as const;

export function HeroIdentity() {
  const name = "Jitansh Arora";
  const [nameCharacters, setNameCharacters] = useState(0);
  const [namePhase, setNamePhase] = useState<"typing" | "settling" | "done">("typing");
  const [taglineStarted, setTaglineStarted] = useState(false);
  const [endingIndex, setEndingIndex] = useState(0);
  const [endingCharacters, setEndingCharacters] = useState(0);
  const [taglinePhase, setTaglinePhase] = useState<"typing" | "holding" | "deleting">("typing");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    let cancelled = false;
    let timer = 0;
    const wait = (duration: number) => new Promise<void>((resolve) => {
      timer = window.setTimeout(resolve, duration);
    });
    const run = async () => {
      for (let count = 1; count <= [...name].length; count += 1) {
        await wait(NAME_TYPING_MS);
        if (cancelled) return;
        setNameCharacters(count);
      }
      setNamePhase("settling");
      await wait(CARET_SETTLE_MS);
      if (cancelled) return;
      setNamePhase("done");
      await wait(TAGLINE_START_DELAY_MS);
      if (cancelled) return;
      setTaglineStarted(true);

      let phraseIndex = 0;
      while (!cancelled) {
        const ending = TAGLINE_ENDINGS[phraseIndex];
        setEndingIndex(phraseIndex);
        setTaglinePhase("typing");
        for (let count = 1; count <= [...ending].length; count += 1) {
          await wait(TAGLINE_TYPING_MS);
          if (cancelled) return;
          setEndingCharacters(count);
        }
        setTaglinePhase("holding");
        await wait(TAGLINE_HOLD_MS);
        if (cancelled) return;
        setTaglinePhase("deleting");
        for (let count = [...ending].length - 1; count >= 0; count -= 1) {
          await wait(TAGLINE_DELETE_MS);
          if (cancelled) return;
          setEndingCharacters(count);
        }
        await wait(TAGLINE_BETWEEN_MS);
        if (cancelled) return;
        phraseIndex = (phraseIndex + 1) % TAGLINE_ENDINGS.length;
      }
    };
    void run();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const ending = TAGLINE_ENDINGS[endingIndex];

  return (
    <>
      <h1 id="hero-title">
        <span className="sr-only">{name}</span>
        <span className="typing-text" aria-hidden="true">
          <span className="typing-measure">{name}</span>
          <span className="typing-layer">
            <span className="typing-animated">{[...name].slice(0, nameCharacters).join("")}</span>
            <span className={`typing-caret is-${namePhase}`} />
            <span className="typing-reduced">{name}</span>
          </span>
        </span>
      </h1>
      <p className="hero-role">
        <span className="sr-only">Software engineer building at the systems layer.</span>
        <span aria-hidden="true">
          Software engineer
          <em className={taglineStarted ? "tagline is-started" : "tagline"}>
            <span className="tagline-fixed">building </span>
            <span className="tagline-ending">
              <span className="tagline-measure">{TAGLINE_ENDINGS[0]}</span>
              <span className="tagline-layer">
                <span className="tagline-animated">{[...ending].slice(0, endingCharacters).join("")}</span>
                <span className={`tagline-caret is-${taglinePhase}`} />
              </span>
            </span>
            <span className="tagline-reduced">
              <span>building </span><span className="tagline-reduced-ending">at the systems layer.</span>
            </span>
          </em>
        </span>
      </p>
    </>
  );
}

export function MotionEnhancer() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const supportsObserver = "IntersectionObserver" in window;
    const root = document.documentElement;

    if (reducedMotion.matches || !supportsObserver) {
      return;
    }

    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          sectionObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8%" },
    );

    root.classList.add("motion-enabled");
    for (const section of sections) sectionObserver.observe(section);

    const timeline = document.querySelector<HTMLElement>("[data-timeline]");
    const timelineRows = timeline ? Array.from(timeline.querySelectorAll<HTMLElement>(".timeline-row")) : [];
    let scrollFrame = 0;

    const updateScrollMotion = () => {
      scrollFrame = 0;
      const maximumScroll = document.documentElement.scrollHeight - window.innerHeight;
      const pageProgress = maximumScroll > 0 ? Math.min(Math.max(window.scrollY / maximumScroll, 0), 1) : 0;
      root.style.setProperty("--scroll-progress", pageProgress.toFixed(4));

      if (!timeline) return;
      const timelineRect = timeline.getBoundingClientRect();
      const progressStart = window.innerHeight * .72;
      const progressEnd = window.innerHeight * .32;
      const progressDistance = timelineRect.height + progressStart - progressEnd;
      const timelineProgress = Math.min(Math.max((progressStart - timelineRect.top) / progressDistance, 0), 1);
      timeline.style.setProperty("--timeline-progress", timelineProgress.toFixed(4));

      const currentLine = window.innerHeight * .52;
      for (const row of timelineRows) {
        const rowRect = row.getBoundingClientRect();
        row.classList.toggle("is-reached", rowRect.top <= currentLine);
        row.classList.toggle("is-current", rowRect.top <= currentLine && rowRect.bottom > currentLine);
      }
    };

    const queueScrollMotion = () => {
      if (scrollFrame) return;
      scrollFrame = requestAnimationFrame(updateScrollMotion);
    };

    window.addEventListener("scroll", queueScrollMotion, { passive: true });
    window.addEventListener("resize", queueScrollMotion);
    updateScrollMotion();

    const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const spotlightCards = hasFinePointer
      ? Array.from(document.querySelectorAll<HTMLElement>(".project-grid .project, .skill-grid .skill-group"))
      : [];
    let spotlightFrame = 0;
    let pendingSpotlight: { card: HTMLElement; x: number; y: number } | undefined;

    const updateSpotlight = () => {
      spotlightFrame = 0;
      if (!pendingSpotlight) return;
      const { card, x, y } = pendingSpotlight;
      card.style.setProperty("--spotlight-x", `${x}px`);
      card.style.setProperty("--spotlight-y", `${y}px`);
    };

    const spotlightHandlers = spotlightCards.map((card) => {
      const onPointerMove = (event: PointerEvent) => {
        const rect = card.getBoundingClientRect();
        card.classList.add("is-spotlit");
        pendingSpotlight = { card, x: event.clientX - rect.left, y: event.clientY - rect.top };
        if (!spotlightFrame) spotlightFrame = requestAnimationFrame(updateSpotlight);
      };
      const onPointerLeave = () => {
        if (pendingSpotlight?.card === card) pendingSpotlight = undefined;
        card.classList.remove("is-spotlit");
        card.style.removeProperty("--spotlight-x");
        card.style.removeProperty("--spotlight-y");
      };
      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerleave", onPointerLeave);
      return { card, onPointerMove, onPointerLeave };
    });

    return () => {
      sectionObserver.disconnect();
      if (scrollFrame) cancelAnimationFrame(scrollFrame);
      if (spotlightFrame) cancelAnimationFrame(spotlightFrame);
      window.removeEventListener("scroll", queueScrollMotion);
      window.removeEventListener("resize", queueScrollMotion);
      for (const { card, onPointerMove, onPointerLeave } of spotlightHandlers) {
        card.removeEventListener("pointermove", onPointerMove);
        card.removeEventListener("pointerleave", onPointerLeave);
        card.classList.remove("is-spotlit");
        card.style.removeProperty("--spotlight-x");
        card.style.removeProperty("--spotlight-y");
      }
      for (const row of timelineRows) row.classList.remove("is-reached", "is-current");
      timeline?.style.removeProperty("--timeline-progress");
      root.style.removeProperty("--scroll-progress");
      root.classList.remove("motion-enabled");
    };
  }, []);

  return null;
}
