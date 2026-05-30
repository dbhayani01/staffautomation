import type { EmailItem, InboxResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const PLACEHOLDER_RECEIVED_AT = "2026-05-30T00:00:00.000Z";

const PLACEHOLDER_INBOX: InboxResponse = {
  current_user: {
    staff_id: 1,
    staff_name: "Demo Admin",
    staff_email: "admin@parakhiya.example",
    role: "admin",
  },
  emails: [
    {
      id: -1,
      sender_email: "client.placeholder@example.com",
      subject: "Placeholder conversation",
      snippet:
        "The live inbox API is temporarily unavailable, so this demo message is shown to keep the dashboard usable.",
      thread_id: "placeholder-thread",
      assigned_staff_id: null,
      received_at: PLACEHOLDER_RECEIVED_AT,
    },
  ],
  staff: [
    {
      staff_id: 1,
      staff_name: "Demo Admin",
      staff_email: "admin@parakhiya.example",
    },
    {
      staff_id: 2,
      staff_name: "Demo Staff",
      staff_email: "staff@parakhiya.example",
    },
  ],
  clients: [
    {
      client_email: "client.placeholder@example.com",
      assigned_staff_id: null,
      thread_count: 1,
      latest_received_at: PLACEHOLDER_RECEIVED_AT,
    },
  ],
};

export type StaffIdentity = {
  staffEmail?: string;
  staffId?: number;
};

function staffHeaders(identity?: StaffIdentity): HeadersInit {
  const staffEmail = identity?.staffEmail ?? process.env.NEXT_PUBLIC_STAFF_EMAIL;
  const staffId = identity?.staffId?.toString() ?? process.env.NEXT_PUBLIC_STAFF_ID;

  if (staffEmail) {
    return { "X-Staff-Email": staffEmail };
  }

  if (staffId) {
    return { "X-Staff-Id": staffId };
  }

  return {};
}

function clonePlaceholderInbox(identity?: StaffIdentity): InboxResponse {
  const staffEmail = identity?.staffEmail;
  const matchingStaff = staffEmail
    ? PLACEHOLDER_INBOX.staff.find((staff) => staff.staff_email.toLowerCase() === staffEmail.toLowerCase())
    : undefined;

  return {
    current_user: {
      ...PLACEHOLDER_INBOX.current_user,
      ...(matchingStaff
        ? {
            staff_id: matchingStaff.staff_id,
            staff_name: matchingStaff.staff_name,
            staff_email: matchingStaff.staff_email,
            role: matchingStaff.staff_email.includes("admin") ? "admin" : "staff",
          }
        : staffEmail
          ? { staff_email: staffEmail, staff_name: staffEmail.split("@")[0] || "Demo Staff", role: "staff" }
          : {}),
    },
    emails: PLACEHOLDER_INBOX.emails.map((email) => ({ ...email })),
    staff: PLACEHOLDER_INBOX.staff.map((staff) => ({ ...staff })),
    clients: PLACEHOLDER_INBOX.clients.map((client) => ({ ...client })),
  };
}

function buildPlaceholderEmail(threadId: string, assignedStaffId?: number): EmailItem {
  return {
    ...PLACEHOLDER_INBOX.emails[0],
    thread_id: threadId,
    assigned_staff_id: assignedStaffId ?? null,
  };
}

function logApiFallback(action: string, error: unknown) {
  console.warn(`${action} API failed; using placeholder data instead.`, error);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(payload.detail ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export async function fetchInbox(identity?: StaffIdentity): Promise<InboxResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails`, {
      cache: "no-store",
      headers: staffHeaders(identity),
    });

    return await parseResponse<InboxResponse>(response);
  } catch (error) {
    logApiFallback("Inbox", error);
    return clonePlaceholderInbox(identity);
  }
}

export async function assignEmail(
  threadId: string,
  assignedStaffId: number,
  identity?: StaffIdentity,
): Promise<EmailItem> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails/assign`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...staffHeaders(identity),
      },
      body: JSON.stringify({ thread_id: threadId, assigned_staff_id: assignedStaffId }),
    });

    return await parseResponse<EmailItem>(response);
  } catch (error) {
    logApiFallback("Assignment", error);
    return buildPlaceholderEmail(threadId, assignedStaffId);
  }
}

export async function sendReply(threadId: string, body: string, identity?: StaffIdentity): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/emails/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...staffHeaders(identity),
      },
      body: JSON.stringify({ thread_id: threadId, body }),
    });

    await parseResponse(response);
  } catch (error) {
    logApiFallback("Reply", error);
  }
}
