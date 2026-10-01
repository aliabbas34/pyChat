import type { ReactNode } from "react";

/** Layout for login and signup: app name above a small centered card. */
export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-100 px-4">
      <p className="mb-6 text-3xl font-bold text-indigo-600">pyChat</p>
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="mb-4 text-lg font-semibold text-slate-900">{title}</h1>
        {children}
      </div>
    </div>
  );
}
