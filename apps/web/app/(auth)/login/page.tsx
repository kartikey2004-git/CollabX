"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@repo/auth";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";
import { loginSchema } from "../../../validation/auth-validation";
import { z } from "zod";

// The login page which is an email/password form + Google/GitHub social sign-in.

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checks the email/password against loginSchema using zod and fills `errors` with field-specific problems. Returns true if valid.

  const validateForm = () => {
    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);

      setErrors({
        email: fieldErrors.email?.[0] ?? "",
        password: fieldErrors.password?.[0] ?? "",
      });

      return false;
    }

    setErrors({});
    return true;
  };

  // Runs when the login form is submitted.
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Ask better-auth to verify the email/password and start a session.
      const { error } = await authClient.signIn.email({ email, password });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      toast.success("Logged in successfully!");
      router.push("/articles");
    } finally {
      setLoading(false);
    }
  };

  // Kicks off the "Sign in with Google" OAuth flow.
  const handleGoogleSignin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/articles`,
    });
    if (error) toast.error(error.message || "Google sign-in failed");
  };

  // Kicks off the "Sign in with GitHub" OAuth flow.
  const handleGithubSignin = async () => {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/articles`,
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

      {/* Right-side marketing panel with the animated engine illustration — hidden on small screens. */}
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
          <Image
            src="/engine-illustration.svg"
            alt="Diagram showing workspace, schema, and docs feeding an AI engine to produce a verified, sourced answer"
            width={480}
            height={560}
            className="w-full max-w-md"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-white/30">
          <span>© {new Date().getFullYear()} CollabX</span>
          <span>architecture · schema · answers</span>
        </div>
      </div>
    </div>
  );
}
