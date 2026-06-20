import type { ApiError } from "./types";

/**
 * Read a failed Response into a single display string. Pulls `error` (and
 * status) from the standard ApiError body when present, otherwise falls back
 * to a status-based message. Safe to call on any non-ok Response.
 */
export async function readApiError(
  res: Response,
  fallback = "Something went wrong",
): Promise<string> {
  try {
    const data = (await res.json()) as Partial<ApiError>;
    if (data?.error) return data.error;
  } catch {
    // body wasn't JSON — fall through to the generic message
  }
  return `${fallback} (HTTP ${res.status})`;
}
