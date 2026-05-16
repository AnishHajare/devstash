import type { Metadata } from "next";
import Script from "next/script";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/space-grotesk";
import "@fontsource/imperial-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://devstash.io";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DevStash",
    template: "%s · DevStash",
  },
  description: "One hub for all your developer knowledge.",
  openGraph: {
    type: "website",
    siteName: "DevStash",
    title: "DevStash",
    description: "One hub for all your developer knowledge.",
    url: siteUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "DevStash",
    description: "One hub for all your developer knowledge.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (() => {
      const key = "devstash-theme";
      const stored = localStorage.getItem(key);
      const theme = stored === "light" || stored === "dark" ? stored : "dark";
      document.documentElement.classList.toggle("dark", theme === "dark");
      document.documentElement.style.colorScheme = theme;
    })();
  `;

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script
          id="devstash-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
