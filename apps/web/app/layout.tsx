import GroundworkFooter from "../components/layout/footer";
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
          <main className="min-h-[80vh] w-full">{children}</main>
          <GroundworkFooter />
        </TooltipProvider>
      </body>
    </html>
  );
}
