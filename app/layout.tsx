import type { Metadata } from "next";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "CollabX — Engineering Knowledge, Reviewed Before It Ships",
  description:
    "Articles and curated Tech Reads, written in Markdown with live Mermaid diagrams, drafted by contributors and published only after an admin reviews it.",
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
