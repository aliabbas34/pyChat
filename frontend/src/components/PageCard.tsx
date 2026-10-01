import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "./icons";

/** Layout for the full-width pages: a centered card with a back arrow and a title. */
export default function PageCard({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-100 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-3">
          <Link to="/" className="icon-btn" title="Back to chats">
            <ArrowLeftIcon />
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-slate-900">{title}</h1>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
