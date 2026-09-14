"use client";

import { Users as UsersIcon } from "lucide-react";
import type { Role } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "../../hooks/use-current-user";
import { useUpdateUserRole, useUsers } from "../../hooks/use-users";
import { EmptyState } from "../shared/empty-state";

const ROLES: Role[] = ["ADMIN", "CONTRIBUTOR", "READER"];

// ADMIN-only "manage users" page (PATCH /users/:id/role) — replaces the direct-database-write
// workaround this product used to require to promote/demote a user. Same skeleton/error/empty
// shape as review-queue-list.tsx.

export function ManageUsersList() {
  const { user: currentUser } = useCurrentUser();
  const { data, isPending, isError, refetch } = useUsers();
  const updateRole = useUpdateUserRole();

  const users = data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Manage Users</h1>
        <p className="text-sm text-muted-foreground">Change a user&apos;s platform role.</p>
      </div>

      {isPending && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <span>Failed to load users</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {!isPending && !isError && users.length === 0 && (
        <EmptyState icon={UsersIcon} title="No users" description="No users found." />
      )}

      {!isPending && !isError && users.length > 0 && (
        <ul className="space-y-2">
          {users.map((u) => {
            const isSelf = u.id === currentUser?.id;
            const pending = updateRole.isPending && updateRole.variables?.id === u.id;

            return (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {u.name} {isSelf && <span className="text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {isSelf ? (
                    <Badge variant="outline" title="Ask another admin to change your own role">
                      {u.role}
                    </Badge>
                  ) : (
                    <Select
                      value={u.role}
                      disabled={pending}
                      onValueChange={(role) => updateRole.mutate({ id: u.id, role: role as Role })}
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
