"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { signUpSchema } from "../../../validation/auth-validation";
import { z } from "zod";

// The signup page which has a name/email/password form, validated with Zod, plus Google/GitHub social sign-up.

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Checks the form values against signUpSchema and fills `errors` with any field-specific problems (e.g. "password too short"). Returns true if valid.

  const validateForm = () => {
    const result = signUpSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);

      setErrors({
        name: fieldErrors.name?.[0] ?? "",
        email: fieldErrors.email?.[0] ?? "",
        password: fieldErrors.password?.[0] ?? "",
        confirmPassword: fieldErrors.confirmPassword?.[0] ?? "",
      });

      return false;
    }

    setErrors({});
    return true;
  };

  // Runs when the signup form is submitted.
  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      // Ask better-auth to create the account; it also triggers the verification email.
      const { error } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Signup failed");
        return;
      }

      toast.success("Account created! Verification email sent.");
      router.push("/verify-email");
    } finally {
      setLoading(false);
    }
  };

  // Kicks off the "Sign up with Google" OAuth flow.
  const handleGoogleSignup = async () => {
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/articles`,
    });
    if (error) toast.error(error.message || "Google signup failed");
  };

  // Kicks off the "Sign up with GitHub" OAuth flow.
  const handleGithubSignup = async () => {
    const { error } = await authClient.signIn.social({
      provider: "github",
      callbackURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/articles`,
    });
    if (error) toast.error(error.message || "GitHub signup failed");
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-md rounded-sm border-slate-200 shadow-none">
          <div className="p-8">
            <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
            <p className="mb-6 text-sm text-slate-600">
              Build documentation, architecture, and project knowledge all in
              one place.
            </p>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block font-normal text-sm mb-1">Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  disabled={loading}
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-normal mb-1">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  className={errors.email ? "border-red-500" : ""}
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-normal mb-1">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  disabled={loading}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-sm bg-black text-white hover:bg-slate-800"
              >
                {loading ? "Creating account..." : "Sign Up"}
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
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full rounded-sm"
              >
                Sign up with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGithubSignup}
                disabled={loading}
                className="w-full rounded-sm"
              >
                Sign up with GitHub
              </Button>
            </div>

            <p className="mt-6 text-center text-sm">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-black hover:underline"
              >
                Sign in
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
