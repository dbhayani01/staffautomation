"use client";

import type { ClientSummary, EmailItem, Staff, StaffOption } from "@/lib/types";
import { formatInboxDate } from "./formatters";

type Props = {
  clients: ClientSummary[];
  emails: EmailItem[];
  staff: StaffOption[];
  user: Staff;
};

function assignedName(staff: StaffOption[], staffId: number | null): string {
  if (staffId === null) return "Unassigned";
  return staff.find((member) => member.staff_id === staffId)?.staff_name ?? `Staff #${staffId}`;
}

export function AdminPanel({ clients, emails, staff, user }: Props) {
  const assignedCount = emails.filter((email) => email.assigned_staff_id !== null).length;
  const unassignedCount = emails.length - assignedCount;

  return (
    <section className="min-h-0 overflow-y-auto bg-slate-50 p-5">
      <div className="mb-6 rounded-[1.75rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-950/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">Admin panel</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight">Hello, {user.staff_name}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Review staff names and database-backed client senders. Client rows are grouped from inbox messages so the panel stays in sync with live email data.
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {[
          ["Total conversations", emails.length.toString()],
          ["Assigned", assignedCount.toString()],
          ["Unassigned", unassignedCount.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Staff names</h3>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{staff.length}</span>
          </div>
          <div className="space-y-3">
            {staff.map((member) => (
              <div key={member.staff_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-sm font-black uppercase text-blue-700">
                  {member.staff_name.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-950">{member.staff_name}</p>
                  <p className="truncate text-xs text-slate-500">{member.staff_email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-950">Clients from database</h3>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700">{clients.length}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.2fr_0.8fr_0.45fr_0.7fr] bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
              <span>Client</span>
              <span>Owner</span>
              <span>Threads</span>
              <span>Latest</span>
            </div>
            <div className="divide-y divide-slate-100">
              {clients.map((client) => (
                <div key={`${client.client_email}-${client.assigned_staff_id ?? "none"}`} className="grid grid-cols-[1.2fr_0.8fr_0.45fr_0.7fr] items-center px-4 py-3 text-sm">
                  <span className="truncate font-semibold text-slate-950">{client.client_email}</span>
                  <span className="truncate text-slate-600">{assignedName(staff, client.assigned_staff_id)}</span>
                  <span className="font-bold text-slate-950">{client.thread_count}</span>
                  <span className="text-xs font-semibold text-slate-400">{formatInboxDate(client.latest_received_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
