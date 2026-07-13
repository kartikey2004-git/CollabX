"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@repo/auth";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      router.push("/forgot-password");
    }
  }, [token, router]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!password) newErrors.password = "Password is required";
    if (password && password.length < 8) newErrors.password = "Password must be at least 8 characters";

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setLoading(true);
    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        toast.error(error.message || "Failed to reset password");
        return;
      }

      toast.success("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="mb-2 text-2xl font-bold">Set New Password</h1>
          <p className="mb-6 text-sm text-slate-600">Enter your new password below.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">New Password</label>
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
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                placeholder="••••••••"
                disabled={loading}
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}