import { NextResponse } from "next/server";

const OPENAI_ERROR = "OPENAI_NOT_CONFIGURED";

export function apiErrorResponse(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : fallback;
  const isOpenAI = message === OPENAI_ERROR;

  return NextResponse.json(
    {
      error: isOpenAI
        ? "OpenAI API key is missing on the server (OPENAI_API_KEY)."
        : message,
      code: isOpenAI ? OPENAI_ERROR : "REQUEST_FAILED",
    },
    { status: isOpenAI ? 503 : 500 }
  );
}
