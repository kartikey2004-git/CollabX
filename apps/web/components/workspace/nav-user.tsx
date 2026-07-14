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

// Type defines shape of user data object

export interface UserData {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Props accepted by this component

interface UserButtonProps {
  onLogout?: () => void | Promise<void>; //callback for logout

  // open settings, profile, billing handler

  onSettings?: () => void;
  onProfile?: () => void;
  onBilling?: () => void;

  // whether to show a small badge on avatar
  showBadge?: boolean;
  badgeText?: string; // text inside badge
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"; // badge variant
  size?: "sm" | "md" | "lg"; // avatar size
  showEmail?: boolean; // whether to show user email in dropdown
  showMemberSince?: boolean; // whether to show "member since" info
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
  // loading state for logout button
  const [isLoading] = useState(false);

  // This hook allows you to programmatically change routes inside Client Component.

  const router = useRouter();
  const { data: session } = authClient.useSession();

  // Actual sign out logic using your auth client , grab signOut function which comes from authClient

  /// onSuccess : a callback function that will be called when a response is successful.

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

  // Get user initials for avatar fallback : If we don't get the avatar image ,  Generate initials for avatar fallback (e.g., "John Doe" → "JD")

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

  // Format member since date
  const formatMemberSince = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(new Date(date));
  };

  // Predefined avatar sizes to keep design consistent
  const avatarSizes = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  // If no user logged in, render nothing

  if (!session?.user) {
    return null;
  }

  const user = session.user;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
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
