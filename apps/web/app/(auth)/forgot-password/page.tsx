"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);
    try {
      // TODO: Call forgot password endpoint
      toast.success("Reset link sent! Check your email.");
      setSent(true);
    } catch (err) {
      toast.error("Failed to send reset email");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
            <p className="mb-6 text-sm text-slate-600">
              We've sent a password reset link to <strong>{email}</strong>. Check your inbox and
              click the link to reset your password.
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
          <Link href="/login" className="mb-4 flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Link>

          <h1 className="mb-2 text-2xl font-bold">Reset Password</h1>
          <p className="mb-6 text-sm text-slate-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
