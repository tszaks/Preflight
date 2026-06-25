import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { TerminalBanner } from "@/components/TerminalBanner";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5173";

export const metadata: Metadata = {
  title: "Preflight | App Store Review Simulator",
  description: "Never get rejected for something you could catch. Preflight runs Apple's review checks on your submission before you hit Send.",
  metadataBase: new URL(baseUrl),
  openGraph: {
    title: "Preflight | App Store Review Simulator",
    description: "Never get rejected for something you could catch. Catch rejection risks before they cost you a week in review purgatory.",
    siteName: "Preflight",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Preflight | App Store Review Simulator",
    description: "Never get rejected for something you could catch.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className="antialiased bg-black text-white"
        suppressHydrationWarning
      >
        <Navbar />
        <TerminalBanner />
        <div className="pt-16 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
