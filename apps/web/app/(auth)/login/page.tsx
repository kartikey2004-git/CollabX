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
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="mb-2 text-2xl font-bold">Welcome Back</h1>
          <p className="mb-6 text-sm text-slate-600">
            Sign in to your CollabX account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="you@example.com"
                disabled={loading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                }}
                placeholder="••••••••"
                disabled={loading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
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
              className="w-full"
            >
              Sign in with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGithubSignin}
              disabled={loading}
              className="w-full"
            >
              Sign in with GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
