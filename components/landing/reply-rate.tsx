"use client";

import { motion } from "framer-motion";
import { FileEdit, Clock, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

const STAGES = [
  { label: "Draft", icon: FileEdit },
  { label: "Pending Review", icon: Clock },
  { label: "Admin Decision", icon: ShieldCheck },
  { label: "Published", icon: CheckCircle2 },
];

const FACTS = [
  "Seven engineering categories, from Backend to Distributed Systems",
  "Markdown + Mermaid — no separate diagramming tool",
  "Every edit after a rejection is a new version, never an overwrite",
  "Publish or reject runs as a single atomic action",
];

export default function ReplyRateSection() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] py-16">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle,#d4d4d4 1px,transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative w-full border border-zinc-200 bg-[#f8f8f8] p-14 md:p-20 ml-4">
        <div className="max-w-5xl">
          <div className="inline-flex items-center bg-emerald-50 px-3 py-2 text-xs uppercase tracking-[0.2em] text-emerald-700">
            • DRAFT → PENDING REVIEW → PUBLISHED
          </div>

          <h2 className="mt-6 text-3xl font-medium tracking-tight text-black md:text-5xl">
            Every Published Piece Passed a Human Review.
          </h2>

          <p className="mt-6 max-w-5xl text-zinc-600">
            Most publishing tools let anyone hit publish. On CollabX, a
            Contributor&apos;s draft becomes Pending Review, and only an
            Admin&apos;s decision makes it live — reject it, and the reason
            travels back with the submission.
          </p>

          <p className="mt-5 text-zinc-700">
            The pipeline is enforced by the platform, not just a convention.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.5fr_0.9fr] -ml-2">
          <PipelineFlow />
          <FactsCard />
        </div>
      </div>
    </section>
  );
}

function PipelineFlow() {
  return (
    <div className="relative flex h-[400px] flex-col justify-center">
      <div className="mb-10 text-center font-mono text-xs uppercase tracking-[0.3em] text-zinc-600">
        Every Submission&apos;s Path
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-stretch sm:justify-between">
        {STAGES.map((stage, index) => {
          const Icon = stage.icon;
          return (
            <div key={stage.label} className="flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-0">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
                className="flex w-full flex-col items-center gap-3 border border-zinc-300 bg-white p-5 text-center"
              >
                <Icon className="h-6 w-6 text-emerald-700" strokeWidth={1.75} />
                <span className="text-sm font-medium text-black">{stage.label}</span>
              </motion.div>

              {index < STAGES.length - 1 && (
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-zinc-400 sm:block sm:-mx-2 sm:mt-9" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FactsCard() {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="group relative max-w-[380px] overflow-hidden rounded-sm border border-zinc-300 bg-white"
    >
      <motion.div
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -inset-40 opacity-70"
        style={{
          background: "conic-gradient(from 0deg,#ffd7d7,#d7fff4,#ddd7ff,#ffd7d7)",
          filter: "blur(80px)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle,#000 1px,transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="relative z-10 p-8 md:p-10">
        <h3 className="text-lg font-medium text-zinc-900">Why the pipeline holds up</h3>

        <ul className="mt-6 space-y-4">
          {FACTS.map((fact) => (
            <li key={fact} className="flex items-start gap-3 text-sm leading-relaxed text-zinc-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {fact}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-sm"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.7), 0 0 40px rgba(180,255,220,0.15)",
        }}
      />
    </motion.div>
  );
}
