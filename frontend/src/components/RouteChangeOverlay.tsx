"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function RouteChangeOverlay() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();

  // Hide overlay when the route finishes loading
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  // Listen for clicks on internal links
  const handleClick = useCallback(
    (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip external links, hash links, and same-page links
      if (
        href.startsWith("http") ||
        href.startsWith("#") ||
        href === pathname ||
        anchor.target === "_blank"
      ) {
        return;
      }

      setIsNavigating(true);
    },
    [pathname]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [handleClick]);

  if (!isNavigating) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 pointer-events-none animate-fade-in-fast">
      <div className="absolute bottom-8 right-8 flex items-center gap-2 text-white/80">
        <span className="text-lg font-bold tracking-widest uppercase font-[var(--font-montserrat)]">
          Loading
          <span className="inline-flex w-6 ml-0.5">
            <span className="animate-dot-bounce" style={{ animationDelay: "0s" }}>.</span>
            <span className="animate-dot-bounce" style={{ animationDelay: "0.2s" }}>.</span>
            <span className="animate-dot-bounce" style={{ animationDelay: "0.4s" }}>.</span>
          </span>
        </span>
        <svg className="w-5 h-5 animate-spin-slow" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
