import "./globals.css";
import { TooltipProvider } from "@repo/ui/components/tooltip";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full">
        <TooltipProvider>
          <main className="flex flex-col items-center justify-between min-h-[80vh] pb-4 px-4 md:pb-8 md:px-8">
            {children}
          </main>
        </TooltipProvider>
      </body>
    </html>
  );
}
