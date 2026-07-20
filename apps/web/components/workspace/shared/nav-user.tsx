"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CreditCard, LogOut, Settings, User } from "lucide-react";

import { toast } from "sonner";
import { authClient } from "@repo/auth";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
} from "@repo/ui/components/sidebar";

// The shape of a user record as used by this component.
export interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Props accepted by this component — mostly optional callbacks/toggles so this button can be reused in different parts of the app with different behavior.

interface UserButtonProps {
  onLogout?: () => void | Promise<void>;

  // Optional click handlers for extra dropdown items — the item only renders if its handler is provided.
  onSettings?: () => void;
  onProfile?: () => void;
  onBilling?: () => void;

  showBadge?: boolean;
  badgeText?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  size?: "sm" | "md" | "lg";
  showEmail?: boolean;
  showMemberSince?: boolean;
}

export function NavUser({
  onSettings,
  onProfile,
  onBilling,
  showBadge = false,
  badgeText = "Pro",
  badgeVariant = "default",
  size = "md",
  showEmail = true,
  showMemberSince = true,
}: UserButtonProps) {

  // Loading state for the logout button (never set to true currently — reserved for future use).
  const [isLoading] = useState(false);

  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Signs the user out via better-auth, then shows a toast and redirects to /login.
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

  // Builds initials to show when there's no avatar image, e.g. "John Doe" -> "JD".
  const getUserInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "U"; // default
  };

  // Formats a date as "Month Year", e.g. "March 2025", for the "Member since" line.
  const formatMemberSince = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  // Tailwind size classes for each `size` prop value.
  const avatarSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // No logged-in user means there's nothing to show here.
  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          {/* Clicking the avatar opens a dropdown with profile/settings/sign-out. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={`relative ${avatarSizes[size]} rounded-full p-0 hover:bg-accent`}
                disabled={isLoading}
              >
                <Avatar className={avatarSizes[size]}>
                  <AvatarImage
                    src={user.image || ""}
                    alt={user.name || "User avatar"}
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {getUserInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                {showBadge && (
                  <Badge
                    variant={badgeVariant}
                    className="absolute -bottom-1 -right-1 h-5 px-1 text-xs"
                  >
                    {badgeText}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side="right"
              align="end"
              sideOffset={12}
              avoidCollisions={false}
              collisionPadding={0}
              className="w-64"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={user.image || ""}
                        alt={user.name || "User avatar"}
                      />
                      <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                        {getUserInitials(user.name, user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user.name || "User"}
                      </p>
                      {showEmail && user.email && (
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                      {showBadge && (
                        <Badge variant={badgeVariant} className="w-fit">
                          {badgeText}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {showMemberSince && (
                    <p className="text-xs text-muted-foreground">
                      Member since {formatMemberSince(user.createdAt)}
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              {onProfile && (
                <DropdownMenuItem
                  onClick={onProfile}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              )}

              {onSettings && (
                <DropdownMenuItem
                  onClick={onSettings}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
              )}

              {onBilling && (
                <DropdownMenuItem
                  onClick={onBilling}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isLoading}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoading ? "Signing out..." : "Sign out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
