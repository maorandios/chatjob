export function parseDataUrl(dataUrl: string): {
  contentType: string;
  buffer: Buffer;
} {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data");
  }

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}
