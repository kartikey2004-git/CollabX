"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CaseStudiesSection() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] py-20">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: "radial-gradient(#d4d4d4 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      />

      <div className="relative w-full border border-zinc-300 bg-[#f7f7f7] p-4 md:p-6 lg:px-10">
        {/* Header */}
        <div className="py-8 text-center mb-4">
          <div className="mb-4 inline-flex bg-amber-50 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-amber-700">
            FOR CONTRIBUTORS, ADMINS & READERS
          </div>

          <h2 className="mx-auto max-w-2xl text-3xl font-medium leading-tightest tracking-[-0.01em] text-black md:text-5xl">
            Everything Between a First Draft
            <br />
            and a Published Read.
          </h2>
        </div>

        <div className="grid grid-cols-12 gap-[1px] bg-zinc-300">
          <CaseCard
            company="Write"
            title="Draft Articles and Tech Reads in Markdown, with Mermaid diagrams rendered live."
            className="col-span-12 md:col-span-4"
          />

          <GradientCard className="col-span-12 md:col-span-4" />

          <GalileoCard className="col-span-12 md:col-span-4 md:row-span-2" />

          <CaseCard
            company="Review"
            title="Admins edit, publish, or reject every submission — with a reason attached."
            className="col-span-12 md:col-span-4"
            accent
          />

          <CaseCard
            company="Discover"
            title="Readers browse by category, follow the table of contents, and join the discussion."
            className="col-span-12 md:col-span-4"
          />
        </div>
        <CTABanner />
      </div>
    </section>
  );
}

function CaseCard({
  title,
  company,
  className,
  accent,
}: {
  title: string;
  company: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      transition={{
        duration: 0.2,
      }}
      className={`relative min-h-[170px] overflow-hidden border border-zinc-300 bg-white ${className}`}
    >
      {accent && (
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: "linear-gradient(135deg,#9fffca,#e6fff2,#d8fff3)",
          }}
        />
      )}

      <div className="relative z-10 p-3">
        <div className="mb-10 text-md font-semibold text-black">{company}</div>

        <h3 className="text-sm leading-snug text-black">{title}</h3>
      </div>
    </motion.div>
  );
}

function GradientCard({ className }: { className?: string }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className={`relative min-h-[170px] overflow-hidden border border-zinc-300 ${className}`}
    >
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg,#ffd7d7,#d7fff3,#ddd7ff,#ffd7d7)",
          backgroundSize: "300% 300%",
        }}
      />

      <div className="absolute inset-0 backdrop-blur-[2px]" />

      <div className="relative z-10 flex h-full flex-col p-5">
        <div className="-mt-2">
          <div className="mb-9 text-md font-semibold text-black">Submit</div>

          <h3 className="max-w-[180px] text-sm leading-snug text-black">
            One active draft per piece, submitted for review with one click.
          </h3>
        </div>
      </div>
    </motion.div>
  );
}

function GalileoCard({ className }: { className?: string }) {
  return (
    <motion.div
      whileHover={{
        y: -4,
      }}
      className={`relative overflow-hidden border border-zinc-300 bg-white ${className}`}
    >
      <div className="p-3">
        <div className="mb-4 text-md font-semibold">
          Everything Between a Draft and a Published Read.
        </div>

        <h3 className="max-w-[220px] text-sm leading-snug">
          Write in Markdown. Submit for review. An admin publishes or
          rejects. Readers discover and discuss.
        </h3>

        <div className="mt-4 flex gap-2">
          <span className="border border-zinc-300 px-1 py-0.5 text-[11px] uppercase">
            MARKDOWN NATIVE
          </span>

          <span className="border border-zinc-300 px-1 py-0.5 text-[11px] uppercase">
            MERMAID READY
          </span>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-44"
        style={{
          background: "linear-gradient(to top,#ff9d32,#ffd7a3,transparent)",
        }}
      />

      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
        <div className="flex-1 border border-white/50 bg-white/60 p-2 backdrop-blur">
          <div className="text-sm font-medium">Draft → Review</div>
          <div className="text-[9px] uppercase text-zinc-700">
            → PUBLISH
          </div>
        </div>

        <div className="flex-1 border border-white/50 bg-white/60 p-2 backdrop-blur">
          <div className="text-sm font-medium">Versioned</div>

          <div className="text-[9px] uppercase text-zinc-700">
            NEVER OVERWRITTEN
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function CTABanner() {
  return (
    <motion.div
      whileHover={{
        scale: 1.01,
      }}
      className="relative mt-[1px] overflow-hidden border border-zinc-300 bg-black"
    >
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle,#ffffff 1px,transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      />

      <div className="absolute right-10 top-1/2 h-40 w-40 -translate-y-1/2 opacity-20">
        <div className="absolute h-20 w-4 bg-white rotate-45" />
        <div className="absolute h-20 w-4 -rotate-45 bg-white" />
        <div className="absolute left-10 h-20 w-4 bg-white rotate-45" />
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:px-10">
        <h3 className="max-w-lg text-2xl font-medium text-white md:text-3xl">
          Everything Between a Draft
          <br />
          and a Published Read.
        </h3>

        <p className="mt-3 max-w-md text-sm text-zinc-400">
          CollabX keeps writing, review, and publishing connected — so
          nothing goes live without a human editorial pass.
        </p>

        <Link
          href="/signup"
          className="mt-6 inline-block bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-zinc-100"
        >
          Get Started Free →
        </Link>
      </div>
    </motion.div>
  );
}
