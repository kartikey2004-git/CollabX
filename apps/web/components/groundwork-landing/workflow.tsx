"use client";

import { workflowStep, workflowsteps } from "../../lib/landing-data";

export function WorkFlow() {
  return (
    <section className="relative overflow-hidden bg-[#fafafa] py-20 -mt-28">
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: "radial-gradient(#d4d4d8 1px, transparent 1px)",
          backgroundSize: "12px 12px",
        }}
      />

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-10">
        <div className="mb-6 flex justify-center">
          <div className="border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.25em] text-emerald-600">
            THE ARCHITECTURE WORKFLOW, GROUNDED
          </div>
        </div>

        <h2 className="mx-auto max-w-3xl text-center text-3xl font-medium tracking-tight text-black md:text-5xl">
          Stop Guessing What Your AI Knows. Start Controlling It.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-neutral-600 md:text-base">
          From whiteboard sketch to verified answer, Groundwork keeps your
          diagrams, schemas, and documentation connected in one explicitly
          indexed workspace.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4">
          {workflowsteps.map((step: workflowStep) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className={`
                  group
                  relative
                  h-[220px]
                  overflow-hidden
                  border-2 cursor-pointer
                  ${step.border}
                  bg-gradient-to-br
                  ${step.bg}
                  p-4
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)]
                `}
              >
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.9),transparent_50%)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.5),transparent_40%)]" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent blur-2xl" />
                </div>

                <Icon
                  size={18}
                  strokeWidth={1.5}
                  className="relative z-10 text-black transition-all duration-300 group-hover:scale-110"
                />

                <div className="absolute bottom-4 left-4 right-4 z-10">
                  <h3
                    className="
                      text-base font-medium text-black md:text-lg
                      transition-all duration-300
                      group-hover:mb-2
                    "
                  >
                    {step.title}
                  </h3>

                  <div
                    className="
                      max-h-0
                      overflow-hidden
                      opacity-0
                      transition-all duration-300
                      group-hover:max-h-20
                      group-hover:opacity-100
                    "
                  >
                    <p className="text-sm leading-relaxed text-black/60">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
