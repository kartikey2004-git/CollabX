"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const RESEND_COOLDOWN_SECONDS = 60;

// Shown right after signup, telling the user to check their inbox, with an option to resend the verification email (rate-limited by a countdown).

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Decrease the resend countdown by 1 every second until it reaches 0.

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Runs when the user asks to resend the verification email.
  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // Ask better-auth to send another verification link to this email.
      const { error } = await authClient.sendVerificationEmail({
        email,
        callbackURL: "/login",
      });

      if (error) {
        toast.error(error.message || "Failed to resend verification email");
        return;
      }

      toast.success("Verification email sent!");
      setSent(true);
      // Start the cooldown so the user can't spam the resend button.
      setResendCountdown(RESEND_COOLDOWN_SECONDS);
    } finally {
      setLoading(false);
    }
  };

  const canResend = resendCountdown === 0;

  // Once an email has been sent, show a confirmation screen instead of the form.
  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 bg-gray-50">
        <Card className="w-full max-w-md rounded-sm">
          <div className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-semibold">Check Your Email</h1>
            <p className="mb-6 text-sm text-slate-600">
              We've sent a verification link to{" "}
              <p className="text-sm font-medium">{email}</p> Check your inbox
              and click the link to verify your email.
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
    <div className="flex min-h-screen items-center justify-center px-4 bg-white-50">
      <Card className="w-full max-w-md rounded-sm">
        <div className="p-8">
          <h1 className="mb-2 text-2xl font-semibold">Verify Your Email</h1>
          <p className="mb-6 text-sm text-slate-600">
            We've sent a verification link to your email. Check your inbox and
            click the link to verify your account.
          </p>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Or enter your email to resend:
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleResendEmail}
            disabled={loading || !canResend}
            className="w-full rounded-sm bg-black text-white hover:bg-slate-800"
            variant={canResend ? "default" : "outline"}
          >
            {loading
              ? "Sending..."
              : canResend
                ? "Resend Verification Email"
                : `Resend in ${resendCountdown}s`}
          </Button>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already verified?{" "}
            <Link
              href="/login"
              className="font-medium text-black hover:underline"
            >
              Go to login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
