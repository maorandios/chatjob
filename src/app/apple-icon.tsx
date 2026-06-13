import { IconMark } from "@/lib/brand/icon-mark";
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<IconMark size={180} radius={40} />, {
    ...size,
  });
}
