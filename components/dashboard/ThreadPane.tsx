"use client";

import type { EmailItem, Staff, StaffOption } from "@/lib/types";
import { formatThreadTimestamp } from "./formatters";

type Props = {
  isAdmin: boolean;
  isPending: boolean;
  notice: string | null;
  replyBody: string;
  selectedThread?: EmailItem;
  staff: StaffOption[];
  threadMessages: EmailItem[];
  user: Staff;
  onAssign: (email: EmailItem, staffId: string) => void;
  onReply: () => void;
  onReplyBodyChange: (value: string) => void;
};

function assigneeLabel(staff: StaffOption[], staffId: number | null): string {
  if (staffId === null) return "Unassigned";
  return staff.find((member) => member.staff_id === staffId)?.staff_name ?? `Staff #${staffId}`;
}

export function ThreadPane({
  isAdmin,
  isPending,
  notice,
  replyBody,
  selectedThread,
  staff,
  threadMessages,
  user,
  onAssign,
  onReply,
  onReplyBodyChange,
}: Props) {
  if (!selectedThread) {
    return (
      <section className="flex h-full items-center justify-center bg-slate-50 p-8">
        <div className="max-w-sm rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-bold text-slate-950">No conversation selected</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Choose a client email from the list to see the full thread and reply composer.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white/90 p-5 backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-blue-600">Client conversation</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{selectedThread.subject ?? "No subject"}</h2>
            <p className="mt-2 text-sm text-slate-500">From {selectedThread.sender_email}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Owner</p>
            <p className="mt-1 font-bold text-slate-950">{assigneeLabel(staff, selectedThread.assigned_staff_id)}</p>
          </div>
        </div>

        {isAdmin ? (
          <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3">
            <span className="text-sm font-semibold text-blue-900">Assign thread</span>
            <select
              value={selectedThread.assigned_staff_id ?? ""}
              onChange={(event) => onAssign(selectedThread, event.target.value)}
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">Unassigned</option>
              {staff.map((member) => (
                <option key={member.staff_id} value={member.staff_id}>
                  {member.staff_name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        {threadMessages.map((message) => (
          <article key={message.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-bold text-slate-950">{message.sender_email}</span>
              <time className="text-xs font-semibold text-slate-400" dateTime={message.received_at}>
                {formatThreadTimestamp(message.received_at)}
              </time>
            </div>
            <p className="whitespace-pre-wrap leading-7 text-slate-700">{message.snippet ?? "No message preview stored."}</p>
          </article>
        ))}
      </div>

      <footer className="border-t border-slate-200 bg-white p-5">
        {notice ? <p className="mb-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">{notice}</p> : null}
        <textarea
          value={replyBody}
          onChange={(event) => onReplyBodyChange(event.target.value)}
          placeholder="Type your reply. Signature is added automatically."
          className="h-28 w-full resize-none rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>Best Regards signature will include {user.staff_name}.</span>
          <button
            onClick={onReply}
            disabled={isPending || !replyBody.trim()}
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isPending ? "Sending..." : "Send Reply"}
          </button>
        </div>
      </footer>
    </section>
  );
}
