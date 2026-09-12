"use client";

import { Button } from "@repo/ui/components/button";
import {
  Lightbulb,
  GitBranch,
  Brain,
  FileText,
  Rocket,
  ArrowRight,
  Workflow,
} from "lucide-react";
import { AnimationContainer } from "./animation-container";
import { cn } from "@repo/ui/lib/utils";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative z-10 w-full px-4 text-center sm:px-6 lg:px-10">
        <div className="w-full text-center">
          <div className="mb-7">
            <span className="inline-flex items-center bg-[#dcfce7] px-5 py-2 text-[12px] font-medium uppercase tracking-[0.22em] text-[#047857]">
              FOR ARCHITECTS, LEADS & ENGINEERING TEAMS
            </span>
          </div>

          <h1 className="mx-auto max-w-[1100px] text-[52px] font-medium leading-[0.96] tracking-[-0.06em] text-black md:text-[66px]">
            Turn Diagrams and Schemas
            <br />
            into an AI Architect You Can
            <br />
            <span className="text-[#047857]">Actually</span> Trust
          </h1>

          <p className="mx-auto mt-7 max-w-190 text-[18px] leading-[1.3] text-[#666666] md:text-[20px]">
            Draw the system, convert it to Markdown, index only what's
            finalized, and query it with answers cited straight from your own
            docs.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-none bg-black px-8 text-[15px] font-medium text-white hover:bg-neutral-900"
            >
              <Link href="/login">
                Start Building
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="h-13 rounded-none border-neutral-300 bg-white px-8 text-[15px] font-medium hover:bg-neutral-50"
            >
              View Docs
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium text-neutral-600">
            <span>Excalidraw |</span>
            <span>DB Schema |</span>
            <span>Manual Indexing |</span>
            <span>Cited Answers</span>
          </div>

          <div className="hidden lg:block">
            <div className="relative mt-40 h-[300px] w-full pt-10">
              <AnimationContainer />

              <SignalCard
                className="absolute left-1/2 top-[-110px] -translate-x-1/2"
                icon={<Lightbulb size={18} />}
                label="Draw Architecture"
              />

              <SignalCard
                className="absolute left-80 top-[-10px]"
                icon={<GitBranch size={18} />}
                label="DB Schema Diagrams"
              />

              <SignalCard
                className="absolute top-[90px] left-50"
                icon={<Brain size={18} />}
                label="Explicit Indexing"
              />

              <SignalCard
                className="absolute right-90 top-[-10px]"
                icon={<FileText size={18} />}
                label="Markdown Docs"
              />

              <SignalCard
                className="absolute right-50 top-[90px]"
                icon={<Rocket size={18} />}
                label="Cited AI Answers"
              />
            </div>

            <div className="-mt-1">
              <DottedFooter />
              <CenterHub />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalCard({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "z-30 flex items-center gap-3 border border-white/60 bg-white/30 px-5 py-3 backdrop-blur-md",
        "shadow-[0_8px_30px_rgba(255,255,255,0.15)]",
        className,
      )}
    >
      {icon}
      <span className="font-medium text-xs md:text-sm uppercase tracking-tight text-black">
        {label}
      </span>
    </div>
  );
}

function DottedFooter() {
  return (
    <div className="absolute bottom-0 z-20 h-[70px] w-full bg-white">
      <div
        className="h-full w-full"
        style={{
          backgroundImage: "radial-gradient(#d9d9d9 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
    </div>
  );
}

function CenterHub() {
  return (
    <div className="absolute bottom-0 left-1/2 z-40 -translate-x-1/2 pt-4 -ml-2">
      <div className="ml-10 flex h-[140px] w-[140px] items-center justify-center rounded-t-[24px] border border-white/70 bg-[#f5f5f5] md:h-[180px] md:w-[180px]">
        <Workflow
          className="h-12 w-12 text-black md:h-16 md:w-16"
          strokeWidth={1.75}
        />
      </div>
    </div>
  );
}
