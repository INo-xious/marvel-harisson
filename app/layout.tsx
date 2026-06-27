import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { FloatingNav } from "@/components/floating-nav";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { PageTransition } from "@/components/page-transition";
import { ThemeProvider, themeBootstrapScript } from "@/components/theme-provider";
import { getRequestLocale } from "@/data/request-locale";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <LanguageProvider initialLocale={locale}>
            <PageTransition>{children}</PageTransition>
            <LanguageToggle />
            <FloatingNav />
          </LanguageProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
