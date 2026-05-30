"use client";

import { FormEvent, useMemo, useState } from "react";
import type { InboxResponse, StaffOption } from "@/lib/types";

type Props = {
  staff: StaffOption[];
  isLoading: boolean;
  onLogin: (email: string) => void;
};

export function LoginPanel({ staff, isLoading, onLogin }: Props) {
  const [email, setEmail] = useState(staff[0]?.staff_email ?? "admin@parakhiya.example");

  const uniqueStaff = useMemo(
    () => Array.from(new Map(staff.map((member) => [member.staff_email, member])).values()),
    [staff],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim()) onLogin(email.trim());
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff)] px-4 py-8 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl shadow-blue-950/10 backdrop-blur xl:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col justify-between bg-slate-950 p-8 text-white sm:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.45em] text-cyan-200">Parakhiya & Co.</p>
            <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight sm:text-6xl">
              Staff workspace for client email operations.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Sign in as staff or admin to view assigned clients, reply with a staff signature, and manage unassigned client conversations.
            </p>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ["Role aware", "Separate staff and admin views"],
              ["Live clients", "Fetched from inbox database"],
              ["Fast replies", "Webhook powered outbound mail"],
            ].map(([title, description]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-slate-300">{description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 sm:p-8">
            <div className="mb-8">
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                Secure staff login
              </div>
              <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose a known staff member or type your staff email. The app sends that identity to the API so database RBAC can scope the dashboard.
              </p>
            </div>

            <label className="text-sm font-semibold text-slate-700" htmlFor="staff-email">
              Staff email
            </label>
            <input
              id="staff-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@parakhiya.co"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              required
            />

            {uniqueStaff.length ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quick users</p>
                <div className="grid gap-2">
                  {uniqueStaff.slice(0, 4).map((member) => (
                    <button
                      type="button"
                      key={member.staff_id}
                      onClick={() => setEmail(member.staff_email)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                    >
                      <span>
                        <span className="block text-sm font-semibold text-slate-900">{member.staff_name}</span>
                        <span className="block text-xs text-slate-500">{member.staff_email}</span>
                      </span>
                      <span className="text-sm text-blue-600">Use</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-8 w-full rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isLoading ? "Signing in..." : "Open dashboard"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export function loginStaffOptions(initialData: InboxResponse): StaffOption[] {
  const currentUserOption = {
    staff_id: initialData.current_user.staff_id,
    staff_name: initialData.current_user.staff_name,
    staff_email: initialData.current_user.staff_email,
  };

  return [currentUserOption, ...initialData.staff];
}
