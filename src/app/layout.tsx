import { ToastProvider } from "@/components/ui/Toast";
import { LEGACY_POLYFILL_SCRIPT } from "@/lib/legacy-polyfills";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Slang",
    template: "%s | Slang",
  },
  description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
  applicationName: "Slang",
  appleWebApp: {
    capable: true,
    title: "Slang",
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
  themeColor: "#f5f6f8",
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
        <script dangerouslySetInnerHTML={{ __html: LEGACY_POLYFILL_SCRIPT }} />
      </head>
      <body className="flex h-full min-h-0 flex-col">
        <ToastProvider>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </ToastProvider>
      </body>
    </html>
  );
}
