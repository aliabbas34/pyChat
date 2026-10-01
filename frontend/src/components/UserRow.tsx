import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { User } from "../types";

/** A user's name linking to their profile, followed by action buttons. */
export default function UserRow({ user, children }: { user: User; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-2 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-slate-900">{user.display_name}</p>
        <p className="truncate text-sm text-slate-500">@{user.username}</p>
      </div>
      <Link to={`/users/${user.username}`} className="btn-secondary">
        View profile
      </Link>
      {children}
    </li>
  );
}
