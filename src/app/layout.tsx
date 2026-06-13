import { StoreHydration } from "@/components/StoreHydration";
import { StoreSync } from "@/components/StoreSync";
import { ToastProvider } from "@/components/ui/Toast";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobChat",
  description: "תקשורת פשוטה בין מנהלים לעובדים זרים",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#003CFF",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" className="h-full">
      <body className="min-h-full">
        <ToastProvider>
          <StoreHydration>
            <StoreSync />
            {children}
          </StoreHydration>
        </ToastProvider>
      </body>
    </html>
  );
}
