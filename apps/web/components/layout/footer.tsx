"use client";

import { Asterisk } from "lucide-react";
import { nav, NavItem } from "../../lib/landing-data";

export default function GroundworkFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#0a0a0a] text-white -mb-20">
      
      <div className="relative grid grid-cols-1 md:grid-cols-2">
        {/* Vertical divider (desktop only) */}
        <div className="absolute inset-y-0 left-1/2 hidden w-px bg-white/10 md:block" />

        {/* LEFT: logo, tagline, contact, email */}
        <div className="border-b border-white/10 px-8 py-14 md:px-12">
          <div className="flex items-center gap-2">
            <Asterisk className="h-6 w-6 text-white" strokeWidth={2} />
            <span className="text-lg font-semibold">Groundwork</span>
          </div>

          <h3 className="mt-8 max-w-md text-2xl font-semibold leading-snug text-white">
            Groundwork — The Hallucination-Free AI Architect
          </h3>

          <p className="mt-3 text-sm text-white/50">
            <span className="font-medium text-white/70">Contact:</span>{" "}
            kartikeybhatnagar247@gmail.com
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 border-b border-white/10 px-8 py-14 md:grid-cols-4 md:px-12">
          {nav.map((col: NavItem) => (
            <div key={col.heading}>
              <h4 className="text-sm font-semibold text-white">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-white/50 transition hover:text-white"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-col items-start justify-between gap-3 px-8 py-6 md:flex-row md:items-center md:px-12">
        <span />
        <div className="flex flex-wrap items-center gap-6 text-xs uppercase tracking-[0.08em] text-white/40">
          <a href="#" className="underline text-white/70 hover:text-white">
            © 2026 Groundwork. All rights reserved.
          </a>
          <a href="#" className="hover:text-white">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-white">
            Terms of Service
          </a>
        </div>
      </div>

      <div className="relative h-[280px] overflow-hidden md:h-[360px]">
        <svg
          className="absolute -bottom-6 left-[-10px] h-[320px] w-[320px] text-white/10 md:left-4"
          viewBox="0 0 320 320"
          fill="none"
        >
          <g stroke="currentColor" strokeWidth="2">
            <rect
              x="60"
              y="60"
              width="120"
              height="120"
              transform="rotate(45 120 120)"
            />
            <rect
              x="140"
              y="60"
              width="120"
              height="120"
              transform="rotate(-45 200 120)"
            />
          </g>
        </svg>

        <div
          className="absolute -bottom-8 left-[260px] whitespace-nowrap text-[220px] font-bold leading-none tracking-tight md:left-[240px] md:text-[220px]"
          style={{
            WebkitTextStroke: "1px rgba(255,255,255,0.12)",
            color: "transparent",
          }}
        >
          Groundwork
        </div>
      </div>

      {/* Grain texture over the watermark area, consistent with the reference */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.15] mix-blend-overlay">
        <filter id="footer-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#footer-grain)" />
      </svg>
    </footer>
  );
}
