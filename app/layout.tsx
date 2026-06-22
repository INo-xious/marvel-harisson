import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FloatingNav } from "@/components/floating-nav";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider, themeBootstrapScript } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Marvel Harisson · Software Engineering Student", template: "%s · Marvel Harisson" },
  description:
    "Marvel Harisson is a software engineering student building practical projects in Python, C++, data automation, robotics, and interactive software.",
  applicationName: "Marvel Harisson Portfolio",
  creator: "Marvel Harisson",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090909" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <PageTransition>{children}</PageTransition>
          <FloatingNav />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
