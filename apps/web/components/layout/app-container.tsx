import { cn } from "@repo/ui/lib/utils";
import type { ReactNode } from "react";

interface AppContainerProps {
  children: ReactNode;
  className?: string;
}

export function AppContainer({ children, className }: AppContainerProps) {
  return <div className={cn("w-full px-4 sm:px-6", className)}>{children}</div>;
}
