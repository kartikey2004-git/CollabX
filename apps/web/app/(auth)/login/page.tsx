"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) {
      setErrors({
        email: !email ? "Email is required" : "",
        password: !password ? "Password is required" : "",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/workspace");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/workspace`,
    });
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  const handleGithubSignin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/workspace`,
    });
    if (error) toast.error(error.message || "GitHub sign-in failed");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md rounded-sm border-slate-200 shadow-none">
          <div className="p-8">
            <h1 className="mb-2 text-2xl font-semibold">Welcome Back</h1>
            <p className="mb-6 text-sm text-slate-600">
              Sign in to continue building with CollabX.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-normal text-sm mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={`${errors.email ? "border-red-500" : ""}`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-normal mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                  placeholder="Enter your password :)"
                  disabled={loading}
                  className={`${errors.password ? "border-red-500" : ""}`}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-normal text-black hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-black text-white hover:bg-slate-800"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 border-t" />
              <span className="text-xs text-slate-600">Or continue with</span>
              <div className="flex-1 border-t" />
            </div>

            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignin}
                disabled={loading}
                className="w-full rounded-sm"
              >
                Sign in with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignin}
                disabled={loading}
                className="w-full rounded-sm"
              >
                Sign in with GitHub
              </Button>
            </div>

            <p className="mt-6 text-center text-sm">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-medium text-black hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </Card>
      </div>

      <div className="relative hidden flex-col justify-between overflow-hidden bg-black px-14 py-14 text-white lg:flex">
        <div>
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
            CollabX
          </span>
          <h2 className="mt-4 max-w-sm text-3xl font-semibold leading-tight">
            Build software with knowledge, not guesswork.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/50">
            Documentation, architecture, and database designs become a
            searchable AI knowledge base for your entire project.
          </p>
        </div>

        <div className="flex items-center justify-center py-6">
          <EngineIllustration />
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>© {new Date().getFullYear()} CollabX</span>
          <span>architecture · schema · answers</span>
        </div>
      </div>
    </div>
  );
}

function EngineIllustration() {
  return (
    <svg
      viewBox="0 0 480 560"
      className="w-full max-w-md"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* connectors — all terminate exactly at box edges, none cross interiors */}
      <g stroke="rgba(255,255,255,0.22)" strokeWidth="1.5">
        {/* workspace -> engine (top-left port) */}
        <path d="M192 96 H199 V176 H206" />
        {/* schema -> engine (mid-left port), already aligned, straight run */}
        <path d="M192 220 H206" />
        {/* docs -> engine (bottom-left port) */}
        <path d="M192 344 H199 V244 H206" />
        {/* engine -> ai query, enters from AI Query's bottom edge */}
        <path d="M320 180 H360 V128" />
      </g>

      {/* live connector — engine -> verified answer, enters from its top edge */}
      <path
        d="M320 236 H360 V280"
        stroke="white"
        strokeWidth="1.5"
        strokeDasharray="4 4"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="16"
          to="0"
          dur="1.1s"
          repeatCount="indefinite"
        />
      </path>

      {/* Workspace node */}
      <g>
        <rect
          x="24"
          y="56"
          width="168"
          height="80"
          stroke="white"
          strokeOpacity="0.6"
        />
        <text
          x="40"
          y="82"
          fill="white"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.5"
        >
          WORKSPACE
        </text>
        <text
          x="40"
          y="104"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          artifacts · revisions
        </text>
        <text
          x="40"
          y="120"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          threaded comments
        </text>
        <line
          x1="192"
          y1="96"
          x2="202"
          y2="96"
          stroke="white"
          strokeOpacity="0.6"
        />
      </g>

      {/* Schema node */}
      <g>
        <rect
          x="24"
          y="180"
          width="168"
          height="80"
          stroke="white"
          strokeOpacity="0.6"
        />
        <text
          x="40"
          y="206"
          fill="white"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.5"
        >
          SCHEMA
        </text>
        <text
          x="40"
          y="228"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          user_id · pgvector
        </text>
        <text
          x="40"
          y="244"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          embeddings (1536)
        </text>
        <line
          x1="192"
          y1="220"
          x2="202"
          y2="220"
          stroke="white"
          strokeOpacity="0.6"
        />
      </g>

      {/* Docs node */}
      <g>
        <rect
          x="24"
          y="304"
          width="168"
          height="80"
          stroke="white"
          strokeOpacity="0.6"
        />
        <text
          x="40"
          y="330"
          fill="white"
          fontSize="13"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.5"
        >
          DOCS
        </text>
        <text
          x="40"
          y="352"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          indexed · verified
        </text>
        <text
          x="40"
          y="368"
          fill="white"
          fillOpacity="0.5"
          fontSize="11"
          fontFamily="ui-monospace, monospace"
        >
          manual index
        </text>
        <line
          x1="192"
          y1="344"
          x2="202"
          y2="344"
          stroke="white"
          strokeOpacity="0.6"
        />
      </g>

      {/* Engine node — resized so it no longer overlaps Verified Answer */}
      <g>
        <rect
          x="206"
          y="146"
          width="114"
          height="114"
          stroke="white"
          strokeWidth="1.5"
        />
        <text
          x="222"
          y="196"
          fill="white"
          fontSize="14"
          fontWeight="600"
          fontFamily="ui-monospace, monospace"
        >
          ENGINE
        </text>
        <text
          x="222"
          y="216"
          fill="white"
          fillOpacity="0.5"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          grounded
        </text>
        <text
          x="222"
          y="230"
          fill="white"
          fillOpacity="0.5"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          traceable
        </text>
        {/* left ports (inputs) */}
        <line
          x1="206"
          y1="176"
          x2="196"
          y2="176"
          stroke="white"
          strokeOpacity="0.6"
        />
        <line
          x1="206"
          y1="220"
          x2="196"
          y2="220"
          stroke="white"
          strokeOpacity="0.6"
        />
        <line
          x1="206"
          y1="244"
          x2="196"
          y2="244"
          stroke="white"
          strokeOpacity="0.6"
        />
        {/* right ports (outputs) */}
        <line
          x1="320"
          y1="180"
          x2="330"
          y2="180"
          stroke="white"
          strokeOpacity="0.6"
        />
        <line
          x1="320"
          y1="236"
          x2="330"
          y2="236"
          stroke="white"
          strokeOpacity="0.6"
        />
      </g>

      {/* AI Query card */}
      <g>
        <rect
          x="288"
          y="56"
          width="168"
          height="72"
          stroke="white"
          strokeWidth="1.5"
        />
        <text
          x="304"
          y="82"
          fill="white"
          fontSize="12"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.5"
        >
          AI QUERY
        </text>
        <text
          x="304"
          y="102"
          fill="white"
          fillOpacity="0.5"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          &quot;schema for payments?&quot;
        </text>
        <circle cx="440" cy="70" r="4" fill="white" fillOpacity="0.8" />
        <line
          x1="360"
          y1="128"
          x2="360"
          y2="138"
          stroke="white"
          strokeOpacity="0.6"
        />
      </g>

      {/* Verified Answer card — moved down so it clears the Engine box entirely */}
      <g>
        <rect
          x="288"
          y="280"
          width="168"
          height="140"
          stroke="white"
          strokeWidth="1.5"
        />
        <line
          x1="360"
          y1="270"
          x2="360"
          y2="280"
          stroke="white"
          strokeOpacity="0.6"
        />
        <text
          x="304"
          y="306"
          fill="white"
          fontSize="12"
          fontFamily="ui-monospace, monospace"
          letterSpacing="0.5"
        >
          VERIFIED ANSWER
        </text>
        <line
          x1="304"
          y1="320"
          x2="440"
          y2="320"
          stroke="white"
          strokeOpacity="0.2"
        />
        <text
          x="304"
          y="340"
          fill="white"
          fillOpacity="0.7"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          order_id (string)
        </text>
        <text
          x="304"
          y="356"
          fill="white"
          fillOpacity="0.7"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          amount (integer)
        </text>
        <text
          x="304"
          y="372"
          fill="white"
          fillOpacity="0.4"
          fontSize="10"
          fontFamily="ui-monospace, monospace"
        >
          + 2 more fields
        </text>
        <line
          x1="304"
          y1="388"
          x2="440"
          y2="388"
          stroke="white"
          strokeOpacity="0.2"
        />
        <text
          x="304"
          y="408"
          fill="white"
          fillOpacity="0.5"
          fontSize="9"
          fontFamily="ui-monospace, monospace"
        >
          source: schema.db, payments.md
        </text>
      </g>

      {/* baseline caption row */}
      <text
        x="24"
        y="480"
        fill="white"
        fillOpacity="0.35"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        every answer traces back to a source.
      </text>
      <text
        x="24"
        y="500"
        fill="white"
        fillOpacity="0.35"
        fontSize="11"
        fontFamily="ui-monospace, monospace"
      >
        nothing grounded, nothing shipped.
      </text>
    </svg>
  );
}