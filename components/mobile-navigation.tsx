"use client";

import { useRef, type MouseEvent } from "react";

const links = [
  ["About", "#about"],
  ["Work", "#experience"],
  ["Projects", "#projects"],
  ["Research", "#research"],
  ["Stack", "#skills"],
] as const;

export function MobileNavigation() {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const navigateTo = (href: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    const target = document.querySelector(href);
    if (!target) return;
    event.preventDefault();
    detailsRef.current?.removeAttribute("open");
    window.history.pushState(null, "", href);
    target.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <details
      className="mobile-navigation"
      ref={detailsRef}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        detailsRef.current?.removeAttribute("open");
        detailsRef.current?.querySelector("summary")?.focus();
      }}
    >
      <summary aria-label="Section navigation">Menu</summary>
      <div className="mobile-navigation-panel" aria-label="Portfolio sections">
        {links.map(([label, href]) => (
          <a key={href} href={href} onClick={navigateTo(href)}>
            {label}
          </a>
        ))}
      </div>
    </details>
  );
}
