import "server-only";
import * as chrono from "chrono-node";
import { TimeIntent } from "@/lib/types";

/**
 * Detects whether an email implies a point in time (proposed meeting,
 * deadline) so it can surface as an unscheduled block on the timeline.
 */
export function detectTimeIntent(text: string): TimeIntent | null {
  const results = chrono.parse(text, new Date(), { forwardDate: true });
  const hit = results.find((r) => r.start.isCertain("hour") || r.start.isCertain("weekday"));
  if (!hit) return null;

  const isMeeting = /\b(meet|sync|call|chat|catch ?up|invite|coffee|check-?in)\b/i.test(text);
  return {
    start: hit.start.date().toISOString(),
    duration: 30,
    phrase: hit.text,
    kind: isMeeting ? "meeting" : "deadline",
  };
}
