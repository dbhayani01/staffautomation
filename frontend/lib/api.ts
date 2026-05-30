import type { EmailItem, InboxResponse } from "./types";

const API_BASE_URL =
  process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export function emptyInboxData(): InboxResponse {
  return {
    current_user: {
      staff_id: 0,
      staff_name: "Unavailable",
      staff_email: "unavailable@parakhiya.co",
      role: "staff",
    },
    emails: [],
    staff: [],
  };
}

function staffHeaders(): HeadersInit {
  const staffEmail = process.env.NEXT_PUBLIC_STAFF_EMAIL;
  const staffId = process.env.NEXT_PUBLIC_STAFF_ID;

  if (staffEmail) {
    return { "X-Staff-Email": staffEmail };
  }

  if (staffId) {
    return { "X-Staff-Id": staffId };
  }

  return {};
}

function requestTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(10_000);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchInbox(): Promise<InboxResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails`, {
      cache: "no-store",
      headers: staffHeaders(),
      signal: requestTimeoutSignal(),
    });

    return parseResponse<InboxResponse>(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to reach inbox API";
    throw new Error(`Unable to load shared inbox from ${API_BASE_URL}: ${message}`);
  }
}

export async function assignEmail(threadId: string, assignedStaffId: number): Promise<EmailItem> {
  const response = await fetch(`${API_BASE_URL}/api/emails/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...staffHeaders(),
    },
    signal: requestTimeoutSignal(),
    body: JSON.stringify({ thread_id: threadId, assigned_staff_id: assignedStaffId }),
  });

  return parseResponse<EmailItem>(response);
}

export async function sendReply(threadId: string, body: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/emails/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...staffHeaders(),
    },
    signal: requestTimeoutSignal(),
    body: JSON.stringify({ thread_id: threadId, body }),
  });

  await parseResponse(response);
}
