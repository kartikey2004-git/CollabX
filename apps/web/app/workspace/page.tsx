"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@repo/auth";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";

export default function WorkspacePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const { user } = session;

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success("Signed out");
          router.push("/login");
        },
        onError: () => {
          toast.error("Failed to sign out");
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold">CollabX Workspace</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <h2 className="mb-4 text-2xl font-bold">Welcome, {user.name || "User"}!</h2>
        <p className="text-slate-600">
          This is your protected workspace. Only authenticated users can see this page.
        </p>
      </main>
    </div>
  );
}
