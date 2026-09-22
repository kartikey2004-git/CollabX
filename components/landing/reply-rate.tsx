"use client";

import { motion } from "framer-motion";
import { PenLine, Users, BookOpenCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const STAGES = [
  { label: "Written By An Engineer", icon: PenLine },
  { label: "Reviewed By A Peer", icon: Users },
  { label: "Added To The Archive", icon: BookOpenCheck },
];

const FACTS = [
  "Seven engineering categories, from Backend to Distributed Systems",
  "Every piece is read by another engineer before it joins the archive",
  "Solutions stay attached to the problem they solved, easy to find again",
  "The archive only grows: nothing gets buried or lost",
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

      <div className="relative w-full border border-zinc-200 bg-[#f8f8f8] p-10 md:p-14">
        <div className="max-w-5xl">
          <div className="inline-flex items-center bg-emerald-50 px-3 py-2 text-xs uppercase tracking-[0.2em] text-emerald-700">
            • REVIEWED BY ENGINEERS, FOR ENGINEERS
          </div>

          <h2 className="mt-6 text-3xl font-medium tracking-tight text-black md:text-5xl">
            Every Piece In The Archive Earned Its Place.
          </h2>

          <p className="mt-6 max-w-5xl text-zinc-600">
            Anyone can contribute. But nothing joins the archive without
            another engineer reading it first, so what you find here has
            already been vetted by someone who knows the difference between
            a real solution and a guess.
          </p>

          <p className="mt-5 text-zinc-700">
            That&apos;s what makes this an archive worth trusting, not just
            another feed.
          </p>
        </div>

        <ReplyBento />
      </div>
    </section>
  );
}

function ReplyBento() {
  return (
    <div className="mt-14">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
        How a piece joins the archive
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:grid-rows-[180px_180px]">
        {/* Main process card */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden border border-zinc-300 bg-white p-6 lg:col-span-2 lg:row-span-2"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                The process
              </p>

              <h3 className="mt-2 max-w-md text-xl font-medium tracking-tight text-black">
                From a solved problem to something the next engineer can use.
              </h3>
            </div>

            <div className="flex h-8 w-8 items-center justify-center border border-zinc-200 bg-zinc-50">
              <BookOpenCheck
                className="h-4 w-4 text-emerald-700"
                strokeWidth={1.7}
              />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-2">
            {STAGES.map((stage, index) => {
              const Icon = stage.icon;

              return (
                <div key={stage.label} className="relative">
                  <div className="border border-zinc-200 bg-zinc-50 p-4">
                    <div className="flex h-7 w-7 items-center justify-center border border-zinc-200 bg-white">
                      <Icon
                        className="h-3.5 w-3.5 text-emerald-700"
                        strokeWidth={1.75}
                      />
                    </div>

                    <p className="mt-8 text-xs font-medium leading-snug text-zinc-900">
                      {stage.label}
                    </p>

                    <span className="mt-2 block font-mono text-[9px] text-zinc-400">
                      0{index + 1}
                    </span>
                  </div>

                  {index < STAGES.length - 1 && (
                    <div className="absolute right-[-8px] top-1/2 z-10 hidden h-px w-4 bg-zinc-300 sm:block" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-0 left-0 h-px w-1/3 bg-emerald-600" />
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="border border-zinc-300 bg-zinc-900 p-6 text-white"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            Coverage
          </p>

          <div className="mt-5 flex items-end justify-between">
            <span className="text-4xl font-medium tracking-tight"></span>
            <span className="max-w-[120px] text-right text-xs leading-relaxed text-zinc-400">
              engineering categories, from Backend to Distributed Systems
            </span>
          </div>
        </motion.div>

        {/* Archive principle */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="border border-zinc-300 bg-white p-6"
        >
          <div className="flex items-center gap-2">
            <PenLine
              className="h-4 w-4 text-emerald-700"
              strokeWidth={1.75}
            />

            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              The principle
            </p>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-zinc-700">
            Solutions stay attached to the problems they solved, so useful
            knowledge can be found again instead of disappearing into a feed.
          </p>
        </motion.div>

        {/* Why it matters */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border border-zinc-300 bg-zinc-50 p-6 lg:col-span-2"
        >
          <div className="flex items-start gap-4">
            <Users
              className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"
              strokeWidth={1.75}
            />

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
                The difference
              </p>

              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-700">
                Every piece is read by another engineer before it becomes part
                of the archive. The goal isn't more content—it&apos;s a growing
                collection of things worth coming back to.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}


