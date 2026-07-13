"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement resend verification email endpoint
      toast.success("Verification email sent!");
      setSent(true);
      setCanResend(false);
      setResendCountdown(60);
    } catch (err) {
      toast.error("Failed to resend verification email");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Countdown timer
  if (resendCountdown > 0) {
    setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
  } else if (resendCountdown === 0 && !canResend) {
    setCanResend(true);
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
            <p className="mb-6 text-sm text-slate-600">
              We've sent a verification link to <strong>{email}</strong>. Check your inbox and
              click the link to verify your email.
            </p>
            <p className="mb-6 text-xs text-slate-500">
              The link expires in 1 hour. If you don't see it, check your spam folder.
            </p>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          <h1 className="mb-2 text-2xl font-bold">Verify Your Email</h1>
          <p className="mb-6 text-sm text-slate-600">
            We've sent a verification link to your email. Check your inbox and click the link to
            verify your account.
          </p>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">Or enter your email to resend:</label>
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
            className="w-full"
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
            <Link href="/login" className="font-medium text-blue-600 hover:underline">
              Go to login
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
