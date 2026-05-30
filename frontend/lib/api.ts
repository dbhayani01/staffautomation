import type { EmailItem, InboxResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchInbox(): Promise<InboxResponse> {
  const response = await fetch(`${API_BASE_URL}/api/emails`, {
    cache: "no-store",
    headers: staffHeaders(),
  });

  return parseResponse<InboxResponse>(response);
}

export async function assignEmail(threadId: string, assignedStaffId: number): Promise<EmailItem> {
  const response = await fetch(`${API_BASE_URL}/api/emails/assign`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...staffHeaders(),
    },
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
    body: JSON.stringify({ thread_id: threadId, body }),
  });

  await parseResponse(response);
}
