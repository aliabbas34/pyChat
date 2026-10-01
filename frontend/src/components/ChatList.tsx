import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getChatList } from "../api/chats";
import { useAuth } from "../context/AuthContext";
import { useSocketEvent } from "../context/SocketContext";
import type { ChatListItem } from "../types";
import { formatChatTime } from "../utils/time";
import { InboxIcon, LogoutIcon, SettingsIcon, UserPlusIcon } from "./icons";
import OnlineDot from "./OnlineDot";

/** Sidebar: toolbar, filter and every friend, latest chat first. */
export default function ChatList({ activeUsername }: { activeUsername?: string }) {
  const { me, logout } = useAuth();
  const [chats, setChats] = useState<ChatListItem[] | null>(null);
  const [filter, setFilter] = useState("");

  const load = useCallback(() => {
    getChatList().then(setChats);
  }, []);

  // Also reload when switching chats, so unread counts of the chat just read are cleared.
  useEffect(load, [load, activeUsername]);

  // A refetch keeps ordering, previews and unread counts exactly as the server computes them.
  useSocketEvent("message.new", load);
  useSocketEvent("friend_request.accepted", load);
  useSocketEvent("friend.removed", load);
  useSocketEvent("presence", ({ username, online }) =>
    setChats((current) =>
      current?.map((chat) => (chat.username === username ? { ...chat, is_online: online } : chat)) ?? null,
    ),
  );

  const query = filter.trim().toLowerCase();
  const visibleChats = chats?.filter(
    (chat) => chat.username.toLowerCase().includes(query) || chat.display_name.toLowerCase().includes(query),
  );

  return (
    <>
      <header className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="min-w-0">
          <p className="text-lg font-bold text-indigo-600">pyChat</p>
          <p className="truncate text-xs text-slate-500">{me?.display_name}</p>
        </div>
        <nav className="flex items-center gap-1">
          <Link to="/search" className="icon-btn" title="Add friend"><UserPlusIcon /></Link>
          <Link to="/requests" className="icon-btn" title="Requests"><InboxIcon /></Link>
          <Link to="/settings" className="icon-btn" title="Settings"><SettingsIcon /></Link>
          <button onClick={logout} className="icon-btn" title="Logout"><LogoutIcon /></button>
        </nav>
      </header>

      {chats === null && <p className="p-4 text-sm text-slate-500">Loading…</p>}

      {chats?.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-slate-500">No friends yet.</p>
          <Link to="/search" className="btn-primary">Add friend</Link>
        </div>
      )}

      {chats && chats.length > 0 && (
        <>
          <div className="border-b border-slate-200 p-3">
            <input className="input" placeholder="Search chats" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          {visibleChats?.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No matches.</p>}
          <ul className="flex-1 overflow-y-auto">
            {visibleChats?.map((chat) => {
              const active = chat.username === activeUsername;
              return (
                <li key={chat.id}>
                  <Link
                    to={`/chat/${chat.username}`}
                    className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 ${active ? "bg-indigo-50" : "hover:bg-slate-50"}`}
                  >
                    <OnlineDot online={chat.is_online} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-medium text-slate-900">{chat.display_name}</p>
                        {chat.last_message_at && (
                          <span className="shrink-0 text-xs text-slate-400">{formatChatTime(chat.last_message_at)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm text-slate-500">{chat.last_message ?? "No messages yet"}</p>
                        {chat.unread_count > 0 && !active && (
                          <span className="shrink-0 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-medium text-white">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
