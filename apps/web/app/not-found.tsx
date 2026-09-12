import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative flex h-screen flex-col items-center justify-center overflow-hidden bg-white px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(to right, black 1px, transparent 1px), linear-gradient(to bottom, black 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <span className="mb-6 font-mono text-xs tracking-[0.3em] text-slate-400">
        ROUTE&nbsp;/&nbsp;404
      </span>

      <h1 className="text-8xl font-semibold leading-none tracking-tight text-black md:text-[10rem]">
        404
      </h1>

      <div className="mt-6 h-px w-16 bg-black" />

      <h2 className="mt-6 text-xl font-semibold tracking-tight text-black md:text-2xl">
        This page doesn&apos;t exist
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-slate-500">
        The link may be broken, or the page may have moved. Check the URL, or
        head back to a page that does.
      </p>

      <div className="mt-10 flex items-center gap-3">
        <Link
          href="/"
          className="bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Back to home
        </Link>
        <Link
          href="/articles"
          className="border border-slate-300 px-6 py-2.5 text-sm font-medium text-black transition-colors hover:border-black"
        >
          Go to Articles
        </Link>
      </div>
    </div>
  );
}
