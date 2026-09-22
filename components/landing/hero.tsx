"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { StackIllustration } from "./stack-illustration";

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative z-10 mx-auto grid w-full max-w-[1300px] gap-16 px-4 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-10">
        <div className="text-left">
          <div className="mb-7">
            <span className="inline-flex items-center bg-[#dcfce7] px-5 py-2 text-[12px] font-medium uppercase tracking-[0.22em] text-[#047857]">
              AN ARCHIVE OPEN TO EVERY ENGINEER
            </span>
          </div>

          <h1 className="max-w-[640px] text-[42px] font-medium leading-[0.96] tracking-[-0.06em] text-black md:text-[54px]">
            The Engineering Archive,
            <br />
            Written By Engineers Who{" "}
            <span className="text-[#047857]">Actually</span>
            <br />
            Did The Work
          </h1>

          <p className="mt-7 max-w-[540px] text-[18px] leading-[1.3] text-[#666666] md:text-[20px]">
            A growing archive of real engineering problems and how they were
            actually solved, written by the engineers who solved them. Read
            what others have already figured out, or contribute what you've
            learned so the next engineer doesn't start from zero.
          </p>

          <div className="mt-12 flex flex-col items-start gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-13 rounded-none bg-black px-8 text-[15px] font-medium text-white hover:bg-neutral-900"
            >
              <Link href="/articles">
                Start Reading
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-13 rounded-none border-neutral-300 bg-white px-8 text-[15px] font-medium hover:bg-neutral-50"
            >
              <Link href="/signup">Become a Contributor</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm font-medium text-neutral-600">
            <span>Real Problems |</span>
            <span>Written By Engineers |</span>
            <span>Reviewed By Peers |</span>
            <span>Always Growing</span>
          </div>
        </div>

        <div className="hidden justify-center py-10 lg:flex">
          <StackIllustration />
        </div>
      </div>
    </section>
  );
}
