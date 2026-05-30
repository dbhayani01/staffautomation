"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { assignEmail, fetchInbox, sendReply, type StaffIdentity } from "@/lib/api";
import type { EmailItem, InboxResponse } from "@/lib/types";
import { AdminPanel } from "./dashboard/AdminPanel";
import { InboxList } from "./dashboard/InboxList";
import { LoginPanel, loginStaffOptions } from "./dashboard/LoginPanel";
import { Sidebar, type DashboardTab } from "./dashboard/Sidebar";
import { ThreadPane } from "./dashboard/ThreadPane";

type Props = {
  initialData: InboxResponse;
};

const SESSION_EMAIL_KEY = "parakhiya.staff.email";

function selectedEmailsForTab(tab: DashboardTab, emails: EmailItem[]): EmailItem[] {
  if (tab === "Unassigned") {
    return emails.filter((email) => email.assigned_staff_id === null);
  }

  return emails;
}

export function InboxDashboard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [activeThreadId, setActiveThreadId] = useState(initialData.emails[0]?.thread_id ?? "");
  const [activeTab, setActiveTab] = useState<DashboardTab>("Inbox");
  const [replyBody, setReplyBody] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [identity, setIdentity] = useState<StaffIdentity | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const savedEmail = window.localStorage.getItem(SESSION_EMAIL_KEY);
    if (!savedEmail) return;

    const savedIdentity = { staffEmail: savedEmail };
    setIdentity(savedIdentity);
    setHasSession(true);
    startTransition(async () => {
      const nextData = await fetchInbox(savedIdentity);
      setData(nextData);
      setActiveThreadId(nextData.emails[0]?.thread_id ?? "");
    });
  }, []);

  const isAdmin = data.current_user.role === "admin";
  const visibleEmails = useMemo(() => selectedEmailsForTab(activeTab, data.emails), [activeTab, data.emails]);
  const selectedThread = visibleEmails.find((email) => email.thread_id === activeThreadId) ?? visibleEmails[0];
  const threadMessages = selectedThread ? data.emails.filter((email) => email.thread_id === selectedThread.thread_id) : [];
  const unassignedCount = data.emails.filter((email) => email.assigned_staff_id === null).length;

  function handleLogin(email: string) {
    const nextIdentity = { staffEmail: email };
    setIdentity(nextIdentity);
    setHasSession(true);
    window.localStorage.setItem(SESSION_EMAIL_KEY, email);
    setNotice(null);

    startTransition(async () => {
      const nextData = await fetchInbox(nextIdentity);
      setData(nextData);
      setActiveTab("Inbox");
      setActiveThreadId(nextData.emails[0]?.thread_id ?? "");
    });
  }

  function handleLogout() {
    window.localStorage.removeItem(SESSION_EMAIL_KEY);
    setIdentity(null);
    setHasSession(false);
    setData(initialData);
    setActiveTab("Inbox");
    setActiveThreadId(initialData.emails[0]?.thread_id ?? "");
    setReplyBody("");
    setNotice(null);
  }

  async function handleAssign(email: EmailItem, staffId: string) {
    if (!staffId) return;
    setNotice(null);
    startTransition(async () => {
      try {
        const updatedEmail = await assignEmail(email.thread_id, Number(staffId), identity ?? undefined);
        setData((current) => ({
          ...current,
          emails: current.emails.map((item) =>
            item.thread_id === updatedEmail.thread_id
              ? { ...item, assigned_staff_id: updatedEmail.assigned_staff_id }
              : item,
          ),
          clients: current.clients.map((client) =>
            client.client_email === updatedEmail.sender_email
              ? { ...client, assigned_staff_id: updatedEmail.assigned_staff_id }
              : client,
          ),
        }));
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
        await sendReply(selectedThread.thread_id, replyBody, identity ?? undefined);
        setReplyBody("");
        setNotice("Reply queued through outbound mail webhook.");
      } catch (error) {
        setNotice(error instanceof Error ? error.message : "Unable to send reply.");
      }
    });
  }

  function handleSelectTab(tab: DashboardTab) {
    setActiveTab(tab);
    if (tab === "Admin") return;
    const nextEmails = selectedEmailsForTab(tab, data.emails);
    setActiveThreadId(nextEmails[0]?.thread_id ?? "");
  }

  if (!hasSession) {
    return <LoginPanel staff={loginStaffOptions(initialData)} isLoading={isPending} onLogin={handleLogin} />;
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,#bfdbfe,transparent_30%),linear-gradient(135deg,#f8fafc,#eef2ff)] p-3 text-slate-950 sm:p-5">
      <section className="mx-auto grid h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-2xl shadow-blue-950/10 backdrop-blur sm:h-[calc(100vh-2.5rem)] lg:grid-cols-[280px_minmax(340px,430px)_1fr]">
        <Sidebar
          activeTab={activeTab}
          user={data.current_user}
          counts={{ inbox: data.emails.length, unassigned: unassignedCount, clients: data.clients.length }}
          onLogout={handleLogout}
          onSelectTab={handleSelectTab}
        />

        {activeTab === "Admin" && isAdmin ? (
          <div className="min-h-0 lg:col-span-2">
            <AdminPanel clients={data.clients} emails={data.emails} staff={data.staff} user={data.current_user} />
          </div>
        ) : (
          <>
            <InboxList
              emails={visibleEmails}
              selectedThreadId={selectedThread?.thread_id}
              staff={data.staff}
              title={activeTab === "Unassigned" ? "Unassigned queue" : "Conversations"}
              subtitle={activeTab === "Unassigned" ? "Needs an owner" : `${data.current_user.staff_name}'s workspace`}
              onSelectThread={setActiveThreadId}
            />
            <ThreadPane
              isAdmin={isAdmin}
              isPending={isPending}
              notice={notice}
              replyBody={replyBody}
              selectedThread={selectedThread}
              staff={data.staff}
              threadMessages={threadMessages}
              user={data.current_user}
              onAssign={handleAssign}
              onReply={handleReply}
              onReplyBodyChange={setReplyBody}
            />
          </>
        )}
      </section>
    </main>
  );
}
