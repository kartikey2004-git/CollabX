import { cn } from "@repo/ui/lib/utils";

// Shared corner-bracket styling used by the four decorative corners below.
const cornerBase = "pointer-events-none absolute h-3 w-3 border-gray-300";

// Wraps page content with a scrollable area and four decorative "L" corner brackets — purely visual framing, no effect on the content itself.

export function ContentPane({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex-1 overflow-hidden bg-white">
      <span className={cn(cornerBase, "top-3 left-3 border-t border-l")} />
      <span className={cn(cornerBase, "top-3 right-3 border-t border-r")} />
      <span className={cn(cornerBase, "bottom-3 left-3 border-b border-l")} />
      <span className={cn(cornerBase, "bottom-3 right-3 border-b border-r")} />
      <div className="h-full overflow-y-auto">{children}</div>
    </div>
  );
}
