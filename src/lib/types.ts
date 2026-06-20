export type Priority = "urgent" | "normal" | "low";

export interface TimeIntent {
  /** ISO datetime the email implies (start of proposed meeting/deadline) */
  start: string;
  /** minutes */
  duration: number;
  /** the phrase that triggered detection, e.g. "Thursday at 2pm" */
  phrase: string;
  kind: "meeting" | "deadline";
}

export interface Email {
  id: string;
  threadId: string;
  from: { name: string; email: string };
  to: string[];
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string; // ISO
  unread: boolean;
  archived: boolean;
  snoozedUntil?: string;
  priority: Priority;
  priorityReason?: string;
  timeIntent?: TimeIntent;
  /** set when the email has been converted into a calendar event */
  scheduledEventId?: string;
  labels: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  attendees: string[];
  location?: string;
  /** id of the email this event was created from, if any */
  sourceEmailId?: string;
  color?: string;
}

/** One message within a Gmail conversation (for the thread view). */
export interface ThreadMessage {
  id: string;
  fromName: string;
  fromEmail: string;
  date: string; // ISO
  body: string;
  snippet: string;
}

export type AgentActionType =
  | "create_event"
  | "send_email"
  | "search"
  | "unknown";

export interface AgentAction {
  type: AgentActionType;
  summary: string;
  event?: Omit<CalendarEvent, "id">;
  email?: { to: string; subject: string; body: string };
  query?: string;
}

export interface AgentPlan {
  reply: string;
  actions: AgentAction[];
}

/**
 * Shape every API route returns on failure. Built on the server by
 * `errorResponse()` (src/server/http.ts) and read on the client by
 * `readApiError()` (src/lib/api.ts).
 */
export interface ApiError {
  /** Human-readable message. */
  error: string;
  /** Error class name, when thrown from an Error (e.g. "TypeError"). */
  name?: string;
  /** HTTP status code. */
  status: number;
  /** Stack trace — debugging aid; only meaningful in development. */
  stack?: string;
}
