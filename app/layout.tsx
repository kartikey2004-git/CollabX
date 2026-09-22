import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "CollabX: The Engineering Archive, Written by Engineers",
  description:
    "A growing archive of real engineering problems and how they were actually solved. Written by the engineers who solved them, reviewed by their peers, and open for any engineer to contribute to.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full">
        <TooltipProvider>
          <main className="min-h-[80vh] w-full">{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
