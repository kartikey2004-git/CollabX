"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";
import { authClient } from "@repo/auth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email) newErrors.email = "Email is required";
    if (email && !email.includes("@")) newErrors.email = "Invalid email format";

    if (!password) newErrors.password = "Password is required";
    if (password && password.length < 8) newErrors.password = "Password must be at least 8 characters";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0],
      });

      if (error) {
        toast.error(error.message || "Signup failed");
        return;
      }

      if (data?.user) {
        toast.success("Account created! Verification email sent.");
        router.push("/verify-email");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/workspace",
      });
    } catch (err) {
      toast.error("Google signup failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignup = async () => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: "/workspace",
      });
    } catch (err) {
      toast.error("GitHub signup failed");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="mb-2 text-2xl font-bold">Create Account</h1>
          <p className="mb-6 text-sm text-slate-600">Join CollabX today</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
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
              className="w-full"
            >
              Sign up with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleGithubSignup}
              disabled={loading}
              className="w-full"
            >
              Sign up with GitHub
            </Button>
          </div>

          <p className="mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
