import { NextResponse } from "next/server";

export function getRequestOrigin(req: Request): string {
  const forwardedHost = req.headers.get("x-forwarded-host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = req.headers.get("host");
  if (host) {
    const proto =
      host.includes("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
