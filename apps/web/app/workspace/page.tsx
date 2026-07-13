"use client";

import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { toast } from "sonner";
import { useSession, signOut } from "@repo/auth";

export default function WorkspacePage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
      router.push("/login");
    } catch (err) {
      toast.error("Failed to sign out");
      console.error(err);
    }
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
