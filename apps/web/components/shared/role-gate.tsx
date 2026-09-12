"use client";

import { ShieldAlert } from "lucide-react";
import { Skeleton } from "@repo/ui/components/skeleton";
import { useCurrentUser } from "../../hooks/use-current-user";
import { canCreateContent, canModerate } from "../../hooks/use-role";
import { EmptyState } from "./empty-state";

/*

"contributor" | "admin" instead of accepting a predicate function (or an icon component) directly:
the pages that use this (app/(app)/articles/new, .../tech-reads/new, .../admin/review*) are Server
Components, and a Server Component can't pass a plain function reference as a prop into a
`"use client"` component — Next.js only allows Server Actions across that boundary. Passing
`canCreateContent`/`canModerate` straight through (and, separately, passing the `ShieldAlert` icon
component itself as a prop) both broke `next build` with "Functions cannot be passed directly to
Client Components unless you explicitly expose it by marking it with 'use server'". A string mode
sidesteps both: this component owns the icon (every use of this gate wants the same "access
denied" icon anyway) and resolves the predicate internally from a plain string.

*/
export type RoleGateMode = "contributor" | "admin";

const PREDICATES: Record<RoleGateMode, typeof canCreateContent> = {
  contributor: canCreateContent,
  admin: canModerate,
};

interface RoleGateProps {
  mode: RoleGateMode;
  title: string;
  description: string;
  children: React.ReactNode;
}

/*

A generic client-side gate: shows `children` only when the current user's role passes the
predicate for `mode`, otherwise shows an EmptyState explaining what's missing.

This is UX only, exactly like every predicate in hooks/use-role.ts — it exists so a READER doesn't
see a form they can't submit, not to actually enforce anything. The server re-checks the real rule
on every request regardless of what this component decided to render.

*/

export function RoleGate({ mode, title, description, children }: RoleGateProps) {
  const { role, isPending } = useCurrentUser();

  if (isPending) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (!PREDICATES[mode](role)) {
    return <EmptyState icon={ShieldAlert} title={title} description={description} />;
  }

  return <>{children}</>;
}
