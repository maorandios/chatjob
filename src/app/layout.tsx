import { LazyStoreSync } from "@/components/LazyStoreSync";
import { PersistRehydrator } from "@/components/PersistRehydrator";
import { ToastProvider } from "@/components/ui/Toast";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "JobChat",
    template: "%s | JobChat",
  },
  description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
  applicationName: "JobChat",
  appleWebApp: {
    capable: true,
    title: "JobChat",
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
  themeColor: "#003CFF",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" className="h-full">
      <body className="h-full">
        <div id="jobchat-overlays" aria-hidden="true" />
        <ToastProvider>
          <div className="h-full">{children}</div>
          <PersistRehydrator />
          <LazyStoreSync />
        </ToastProvider>
      </body>
    </html>
  );
}
