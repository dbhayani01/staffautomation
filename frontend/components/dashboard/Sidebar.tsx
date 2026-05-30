"use client";

import type { Staff } from "@/lib/types";

export type DashboardTab = "Inbox" | "Unassigned" | "Admin";

type Props = {
  activeTab: DashboardTab;
  user: Staff;
  counts: {
    inbox: number;
    unassigned: number;
    clients: number;
  };
  onLogout: () => void;
  onSelectTab: (tab: DashboardTab) => void;
};

export function Sidebar({ activeTab, user, counts, onLogout, onSelectTab }: Props) {
  const isAdmin = user.role === "admin";
  const tabs: Array<{ tab: DashboardTab; label: string; count: number }> = [
    { tab: "Inbox", label: "My inbox", count: counts.inbox },
    ...(isAdmin ? [{ tab: "Unassigned" as const, label: "Unassigned", count: counts.unassigned }] : []),
    ...(isAdmin ? [{ tab: "Admin" as const, label: "Admin panel", count: counts.clients }] : []),
  ];

  return (
    <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white/90 p-4 lg:p-5">
      <div className="mb-8 rounded-3xl bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lg font-black text-slate-950">
          PC
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200">Parakhiya</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">Staff Automation</h1>
      </div>

      <nav className="space-y-2">
        {tabs.map((item) => (
          <button
            key={item.tab}
            onClick={() => onSelectTab(item.tab)}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
              activeTab === item.tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            }`}
          >
            <span>{item.label}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === item.tab ? "bg-white/20" : "bg-slate-100"}`}>
              {item.count}
            </span>
          </button>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold uppercase text-blue-700">
            {user.staff_name.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950">{user.staff_name}</p>
            <p className="truncate text-xs text-slate-500">{user.staff_email}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold uppercase text-emerald-700">
            {user.role}
          </span>
          <button onClick={onLogout} className="text-xs font-bold text-slate-500 transition hover:text-red-600">
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
