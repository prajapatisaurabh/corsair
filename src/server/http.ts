import "server-only";
import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/types";

/**
 * Build a consistent error response for API routes. Accepts a thrown Error
 * (preserves name + stack) or a plain string message. The body always matches
 * the ApiError shape so the client can render message / status / stack
 * uniformly (see readApiError in src/lib/api.ts).
 */
export function errorResponse(
  input: unknown,
  status = 500,
): NextResponse<ApiError> {
  const err = input instanceof Error ? input : undefined;
  const body: ApiError = {
    error: err ? err.message : String(input),
    name: err?.name,
    status,
    stack: err?.stack,
  };
  return NextResponse.json(body, { status });
}
