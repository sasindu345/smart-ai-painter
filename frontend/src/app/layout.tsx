import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { QueryProvider } from "@/components/shared/QueryProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://smart-ai-painter.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Smart AI Painter — Sketch to AI artwork",
    template: "%s · Smart AI Painter",
  },
  description:
    "A workspace-first sketch editor that turns your drawings into polished AI artwork in seconds.",
  applicationName: "Smart AI Painter",
  keywords: [
    "AI art",
    "sketch to image",
    "drawing app",
    "AI painter",
    "fabric.js",
    "stable diffusion",
  ],
  openGraph: {
    type: "website",
    siteName: "Smart AI Painter",
    title: "Smart AI Painter — Sketch to AI artwork",
    description:
      "Draw on a real editor canvas, then turn your sketch into AI artwork without leaving your workspace.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart AI Painter",
    description:
      "Sketch first. Then let AI finish it for you. A workspace-first painter.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f2ec" },
    { media: "(prefers-color-scheme: dark)", color: "#17181d" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>
        <QueryProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div id="main-content">{children}</div>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
