import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mister Deniz | edu-portal",
  description: "Your complete classroom companion - homework, announcements, surveys, and messages.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-paper text-ink antialiased parchment-grain">
        {children}
      </body>
    </html>
  );
}