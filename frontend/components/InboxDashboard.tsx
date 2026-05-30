"use client";

import { useMemo, useState, useTransition } from "react";
import { assignEmail, sendReply } from "@/lib/api";
import type { EmailItem, InboxResponse } from "@/lib/types";

type Props = {
  initialData: InboxResponse;
  initialError?: string;
};

const tabs = ["My Inbox", "Unassigned Queue", "Staff Settings"] as const;

export function InboxDashboard({ initialData, initialError }: Props) {
  const [emails, setEmails] = useState(initialData.emails);
  const [activeThreadId, setActiveThreadId] = useState(emails[0]?.thread_id ?? "");
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("My Inbox");
  const [replyBody, setReplyBody] = useState("");
  const [notice, setNotice] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  const isAdmin = initialData.current_user.role === "admin";
  const visibleTabs = isAdmin ? tabs : tabs.filter((tab) => tab !== "Unassigned Queue");

  const visibleEmails = useMemo(() => {
    if (activeTab === "Unassigned Queue") {
      return emails.filter((email) => email.assigned_staff_id === null);
    }

    return emails;
  }, [activeTab, emails]);

  const selectedThread = visibleEmails.find((email) => email.thread_id === activeThreadId) ?? visibleEmails[0];
  const threadMessages = selectedThread
    ? emails.filter((email) => email.thread_id === selectedThread.thread_id)
    : [];

  async function handleAssign(email: EmailItem, staffId: string) {
    if (!staffId) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const updatedEmail = await assignEmail(email.thread_id, Number(staffId));
        setEmails((current) =>
          current.map((item) => (item.thread_id === updatedEmail.thread_id ? updatedEmail : item)),
        );
        setNotice("Thread assigned successfully.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to assign thread.");
      }
    });
  }

  async function handleReply() {
    if (!selectedThread || !replyBody.trim()) return;
    setNotice(null);
    startTransition(async () => {
      try {
        await sendReply(selectedThread.thread_id, replyBody);
        setReplyBody("");
        setNotice("Reply queued through outbound mail webhook.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to send reply.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4">
      <section className="mx-auto grid h-[calc(100vh-2rem)] max-w-7xl grid-cols-[240px_minmax(320px,420px)_1fr] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <aside className="border-r border-slate-200 bg-slate-950 p-5 text-white">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200">Parakhiya & Co.</p>
            <h1 className="mt-2 text-2xl font-semibold">Shared Inbox</h1>
          </div>
          <nav className="space-y-2">
            {visibleTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  activeTab === tab ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="mt-8 rounded-2xl bg-white/10 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">{initialData.current_user.staff_name}</p>
            <p>{initialData.current_user.staff_email}</p>
            <p className="mt-2 inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs uppercase text-blue-100">
              {initialData.current_user.role}
            </p>
          </div>
        </aside>

        <section className="flex min-h-0 flex-col border-r border-slate-200">
          {initialError ? (
            <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800">
              The inbox API is currently unreachable. Start the FastAPI service or set API_BASE_URL /
              NEXT_PUBLIC_API_BASE_URL, then refresh. Details: {initialError}
            </div>
          ) : null}
          <div className="border-b border-slate-200 p-5">
            <p className="text-sm font-medium text-slate-500">{activeTab}</p>
            <h2 className="text-2xl font-semibold text-slate-950">{visibleEmails.length} conversations</h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleEmails.map((email) => (
              <article
                key={email.id}
                onClick={() => setActiveThreadId(email.thread_id)}
                className={`cursor-pointer border-b border-slate-100 p-5 transition hover:bg-blue-50 ${
                  selectedThread?.id === email.id ? "bg-blue-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-950">{email.sender_email}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-700">{email.subject ?? "No subject"}</p>
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {new Date(email.received_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-500">{email.snippet ?? "No preview available."}</p>
                {isAdmin && email.assigned_staff_id === null ? (
                  <select
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    defaultValue=""
                    disabled={isPending}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => handleAssign(email, event.target.value)}
                  >
                    <option value="">Assign to staff...</option>
                    {initialData.staff.map((staff) => (
                      <option key={staff.staff_id} value={staff.staff_id}>
                        {staff.staff_name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="flex min-h-0 flex-col bg-slate-50">
          {selectedThread ? (
            <>
              <header className="border-b border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-500">Thread {selectedThread.thread_id}</p>
                <h2 className="mt-1 text-2xl font-semibold text-slate-950">{selectedThread.subject ?? "No subject"}</h2>
                <p className="mt-2 text-sm text-slate-500">From {selectedThread.sender_email}</p>
              </header>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                {threadMessages.map((message) => (
                  <article key={message.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-3 flex items-center justify-between text-sm text-slate-500">
                      <span>{message.sender_email}</span>
                      <time>{new Date(message.received_at).toLocaleString()}</time>
                    </div>
                    <p className="whitespace-pre-wrap text-slate-700">{message.snippet ?? "No message preview stored."}</p>
                  </article>
                ))}
              </div>
              <footer className="border-t border-slate-200 bg-white p-5">
                {notice ? <p className="mb-3 rounded-xl bg-blue-50 px-4 py-2 text-sm text-blue-700">{notice}</p> : null}
                <textarea
                  value={replyBody}
                  onChange={(event) => setReplyBody(event.target.value)}
                  placeholder="Type your reply. Signature is added automatically."
                  className="h-28 w-full resize-none rounded-2xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Best Regards signature will include {initialData.current_user.staff_name}.</span>
                  <button
                    onClick={handleReply}
                    disabled={isPending || !replyBody.trim()}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isPending ? "Sending..." : "Send Reply"}
                  </button>
                </div>
              </footer>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500">No conversations available.</div>
          )}
        </section>
      </section>
    </main>
  );
}
