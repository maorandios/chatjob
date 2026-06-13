import { IconMark } from "@/lib/brand/icon-mark";
import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<IconMark size={512} />, {
    ...size,
  });
}
