"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Step, steps } from "../../lib/landing-data";
import { Sparkles } from "lucide-react";

export default function ProcessSection() {
  const [active, setActive] = useState(steps[0].id);

  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isProgrammaticScroll = useRef(false);
  const unlockTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeStep = steps.find((step) => step.id === active) ?? steps[0];

  const handleTitleClick = (id: number) => {
    const target = sectionRefs.current[id];
    if (!target) return;

    isProgrammaticScroll.current = true;
    setActive(id);
    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (unlockTimeout.current) clearTimeout(unlockTimeout.current);
    unlockTimeout.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 700);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isProgrammaticScroll.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number((entry.target as HTMLElement).dataset.stepId);
            if (!Number.isNaN(id)) setActive(id);
          }
        });
      },
      {
        root: container,
        rootMargin: "-45% 0px -45% 0px",
        threshold: 0,
      },
    );

    Object.values(sectionRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-black text-white">
      <div className="w-full px-4 py-24 sm:px-6 lg:px-10">
        <div className="grid gap-20 lg:grid-cols-2">
          <div className="flex flex-col">
            {steps.map((step) => {
              const isActive = active === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleTitleClick(step.id)}
                  className="group relative py-8 text-left"
                >
                  <div className="flex items-start gap-4">
                    
                    <div className="flex-1">
                      <h3
                        className={`text-xl transition-all ${
                          isActive
                            ? "text-white"
                            : "text-white/50 group-hover:text-white/80"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <AnimatePresence>
                        {isActive && (
                          <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.35 }}
                            className="mt-3 max-w-md overflow-hidden text-sm text-white/60"
                          >
                            {step.description}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="mt-8 h-px bg-white/15">
                    {isActive && (
                      <motion.div
                        layoutId="active-line"
                        className="h-full bg-gradient-to-r from-pink-300 via-orange-200 to-white"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div
            ref={scrollContainerRef}
            className="relative h-[600px] overflow-y-auto
    [scrollbar-width:none]
    [-ms-overflow-style:none]
    [&::-webkit-scrollbar]:hidden"
          >
            {steps.map((step) => (
              <div
                key={step.id}
                ref={(el) => {
                  sectionRefs.current[step.id] = el;
                }}
                data-step-id={step.id}
                className="flex min-h-[600px] items-center"
              >
                <motion.div
                  animate={{
                    opacity: active === step.id ? 1 : 0.35,
                    filter: active === step.id ? "blur(0px)" : "blur(1px)",
                  }}
                  transition={{ duration: 0.3 }}
                  className="w-full p-8 backdrop-blur-xl"
                >
                  <SignalCard step={step} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalCard({ step }: { step: Step }) {
  const Icon = step.icon;

  return (
    <div className="relative overflow-hidden p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
      <div className="relative flex items-center justify-between">
        <div className="rounded-2xl p-4">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex gap-2">
          {step.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-none border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="relative mt-8">
        <div className="mb-3 inline-flex items-center gap-2 rounded-none border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
          <Sparkles className="h-3 w-3" />
          {step.panelTitle}
        </div>
        <h3 className="text-3xl font-medium tracking-tight">{step.title}</h3>
        <p className="mt-4 max-w-md leading-relaxed text-white/60">
          {step.panelDescription}
        </p>
      </div>
      <div className="relative mt-10 space-y-3">
        <div className="rounded-none border border-white/10 bg-white/5 p-4">
          <div className="mb-2 h-2 w-24 rounded-none bg-white/20" />
          <div className="h-2 w-full rounded-none bg-white/10" />
        </div>
        <div className="rounded-none border border-white/10 bg-white/5 p-4">
          <div className="mb-2 h-2 w-32 rounded-none bg-white/20" />
          <div className="h-2 w-4/5 rounded-none bg-white/10" />
        </div>
        <div className="rounded-none border border-white/10 bg-white/5 p-4">
          <div className="mb-2 h-2 w-20 rounded-none bg-white/20" />
          <div className="h-2 w-3/4 rounded-none bg-white/10" />
        </div>
      </div>
    </div>
  );
}
