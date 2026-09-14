"use client";

import { useState, useEffect, Suspense, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { resetPasswordSchema } from "../../../validation/auth-validation";
import z from "zod";

// Holds the actual form logic; wrapped in <Suspense> below because useSearchParams() needs that in Next.js.

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // The reset token comes from the link in the password-reset email, e.g. ?token=abc123.
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // If someone lands on this page without a token, the link is broken/expired — bounce them back to request a new one.

  useEffect(() => {
    if (!token) {
      toast.error("Invalid reset link");
      router.push("/forgot-password");
    }
  }, [token, router]);

  // Checks the new password + confirmation against resetPasswordSchema and fills `errors` with any field-specific problems. Returns true if valid.

  const validateForm = () => {
    const result = resetPasswordSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!result.success) {
      const { fieldErrors } = z.flattenError(result.error);

      setErrors({
        password: fieldErrors.password?.[0] ?? "",
        confirmPassword: fieldErrors.confirmPassword?.[0] ?? "",
      });

      return false;
    }

    setErrors({});
    return true;
  };

  // Runs when the "reset password" form is submitted.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm() || !token) return;

    setLoading(true);
    try {
      // Send the new password + the token from the email link to better-auth.
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

  // While redirecting away (no token), render nothing instead of a broken form.
  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md rounded-sm">
        <div className="p-8">
          <h1 className="mb-1 text-2xl font-semibold">Set New Password</h1>
          <p className="mb-6 text-sm text-slate-600">
            Enter your new password below.
          </p>

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
                placeholder="Enter your new password"
                disabled={loading}
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Confirm Password
              </label>
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
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

// Wraps the page content in Suspense since reading the URL's search params (the reset token) requires it in Next.js's app router.

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}