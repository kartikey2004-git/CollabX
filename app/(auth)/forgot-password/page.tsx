"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

// The "forgot password" page where user enters their email, we ask better-auth to send them a reset link, and show a confirmation screen once it's sent.

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // Runs when the "send reset link" form is submitted.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // Ask better-auth to email a reset link; the link points to /reset-password.
      const { error } = await authClient.requestPasswordReset({
        email,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      if (error) {
        toast.error(error.message || "Failed to send reset email");
        return;
      }

      toast.success("Reset link sent! Check your email.");
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  // After the email is sent, swap the form out for a "check your email" confirmation.
  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
        <Card className="w-full max-w-md rounded-sm">
          <div className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold">Check Your Email</h1>
            <p className="mb-6 text-sm text-slate-600">
              We've sent a password reset link to
              <p className="text-sm font-medium">{email}</p>
              Check your inbox and click the link to reset your password.
            </p>
            <p className="mb-6 text-xs text-slate-500">
              The link expires in 1 hour. If you don't see it, check your spam
              folder.
            </p>
            <Link href="/login">
              <Button className="w-full rounded-sm bg-black text-white hover:bg-slate-800">
                Back to Login
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
      <Card className="w-full max-w-md rounded-sm">
        <div className="p-8">
          <Link
            href="/login"
            className="mb-4 flex items-center gap-2 text-sm  hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <h1 className="mb-2 text-2xl font-semibold">Reset Password</h1>
          <p className="mb-6 text-sm text-slate-600">
            Enter your email address and we'll send you a link to reset your
            password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-normal">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-sm bg-black text-white hover:bg-slate-800"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
