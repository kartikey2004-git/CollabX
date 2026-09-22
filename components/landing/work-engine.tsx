"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Feature, leftFeatures, rightFeatures } from "../../lib/landing-data";

export default function ReviewEngineSection() {
  return (
    <section className="bg-black py-16">
      <div className="w-full px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col justify-between gap-8 pb-12 md:flex-row md:items-start">
          <div>
            <h2 className="text-2xl  text-white md:text-3xl">
              What Powers The <br/> Archive
            </h2>
           
          </div>

          <div className="max-w-sm md:text-right">
            <p className="text-sm leading-relaxed text-zinc-500">
              Most engineering knowledge lives in scattered notes, half-
              finished docs, or a chat thread that gets buried in a week. It
              never becomes something the next person can actually find.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              CollabX exists so that knowledge doesn&apos;t disappear. Every
              piece becomes a lasting part of the archive.
            </p>

            <Link
              href="/signup"
              className="mt-4 inline-flex items-center gap-2 border border-white bg-white px-4 py-2 text-xs font-medium text-black transition hover:bg-zinc-200"
            >
              Get Started
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 border border-zinc-800 md:grid-cols-2">
          <div className="grid grid-rows-5 divide-y divide-zinc-800 border-b border-zinc-800 md:border-b-0 md:border-r">
            <FeatureCell feature={leftFeatures[0]} />
            <EmptyCell />
            <FeatureCell feature={leftFeatures[1]} />
            <EmptyCell />
            <FeatureCell feature={leftFeatures[2]} />
          </div>

          <div className="grid grid-rows-5 divide-y divide-zinc-800">
            <EmptyCell />
            <FeatureCell feature={rightFeatures[0]} />
            <EmptyCell />
            <FeatureCell feature={rightFeatures[1]} />
            <EmptyCell />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCell({ feature }: { feature: Feature }) {

  return (
    <div className={`relative p-5 ${feature.accent ? "" : ""}`}>
    
      <h3 className="text-md tracking-tight text-white">{feature.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        {feature.description}
      </p>
    </div>
  );
}

function EmptyCell() {
  return <div className="min-h-[110px]" />;
}
