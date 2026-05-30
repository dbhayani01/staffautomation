"use client";

import type { EmailItem, StaffOption } from "@/lib/types";
import { formatInboxDate } from "./formatters";

type Props = {
  emails: EmailItem[];
  selectedThreadId?: string;
  staff: StaffOption[];
  title: string;
  subtitle: string;
  onSelectThread: (threadId: string) => void;
};

function assigneeName(staff: StaffOption[], staffId: number | null): string {
  if (staffId === null) return "Unassigned";
  return staff.find((member) => member.staff_id === staffId)?.staff_name ?? `Staff #${staffId}`;
}

export function InboxList({ emails, selectedThreadId, staff, title, subtitle, onSelectThread }: Props) {
  return (
    <section className="flex min-h-0 flex-col border-r border-slate-200 bg-white/70">
      <div className="border-b border-slate-200 p-5">
        <p className="text-sm font-semibold text-blue-600">{subtitle}</p>
        <div className="mt-1 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
            {emails.length}
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {emails.length ? (
          <div className="space-y-2">
            {emails.map((email) => (
              <article
                key={`${email.id}-${email.thread_id}`}
                onClick={() => onSelectThread(email.thread_id)}
                className={`cursor-pointer rounded-3xl border p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/70 hover:shadow-lg hover:shadow-blue-950/5 ${
                  selectedThreadId === email.thread_id
                    ? "border-blue-200 bg-blue-50 shadow-lg shadow-blue-950/5"
                    : "border-transparent bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-950">{email.sender_email}</p>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-700">{email.subject ?? "No subject"}</p>
                  </div>
                  <time className="shrink-0 text-xs font-semibold text-slate-400" dateTime={email.received_at}>
                    {formatInboxDate(email.received_at)}
                  </time>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                  {email.snippet ?? "No message preview stored."}
                </p>
                <div className="mt-4 flex items-center justify-between gap-2 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">
                    {assigneeName(staff, email.assigned_staff_id)}
                  </span>
                  <span className="font-semibold text-slate-400">#{email.thread_id.slice(0, 8)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white text-sm font-semibold text-slate-400">
            No conversations here yet.
          </div>
        )}
      </div>
    </section>
  );
}
