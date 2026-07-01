import { PushNavigationListener } from "@/components/PushNavigationListener";
import { ToastProvider } from "@/components/ui/Toast";
import { PageStackTransition } from "@/components/ui/PageStackTransition";
import { LEGACY_POLYFILL_SCRIPT } from "@/lib/legacy-polyfills";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "קלינג",
    template: "%s | קלינג",
  },
  description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
  applicationName: "קלינג",
  icons: {
    icon: [{ url: "/fav.svg", type: "image/svg+xml", sizes: "any" }],
    shortcut: "/fav.svg",
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    title: "קלינג",
    description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
    siteName: "קלינג",
    images: [
      {
        url: "/kling-og.png",
        width: 1200,
        height: 630,
        alt: "קלינג",
      },
    ],
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "קלינג",
    description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
    images: ["/kling-og.png"],
  },
  appleWebApp: {
    capable: true,
    title: "קלינג",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" className="h-full">
      <head>
        {/* Sync polyfills before any async Next.js chunks — parse-safe on Safari 15 */}
        <Script
          id="legacy-polyfills"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: LEGACY_POLYFILL_SCRIPT }}
        />
      </head>
      <body className="flex h-full min-h-0 flex-col">
        <PushNavigationListener />
        <ToastProvider>
          <div className="flex min-h-0 flex-1 flex-col">
            <Suspense fallback={children}>
              <PageStackTransition>{children}</PageStackTransition>
            </Suspense>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
