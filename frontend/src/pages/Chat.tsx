import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { getMessages, MESSAGE_PAGE_SIZE } from "../api/chats";
import { getProfile } from "../api/users";
import { ArrowLeftIcon, SendIcon } from "../components/icons";
import OnlineDot from "../components/OnlineDot";
import { useAuth } from "../context/AuthContext";
import { useSocket, useSocketEvent } from "../context/SocketContext";
import type { Message, Profile } from "../types";
import { formatClock } from "../utils/time";

const TYPING_SEND_INTERVAL_MS = 2000;
const TYPING_SHOW_MS = 3000;

export default function Chat() {
  const { username = "" } = useParams();
  const { me } = useAuth();
  const { send } = useSocket();

  const [friend, setFriend] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  // How to adjust scroll after messages change: jump to the bottom, or keep
  // the view still after older messages were prepended above it.
  const scrollAfterRender = useRef<{ toBottom: true } | { keepFromBottom: number } | null>(null);
  const typingTimer = useRef<number>();
  const lastTypingSent = useRef(0);
  const loadingOlder = useRef(false);

  useEffect(() => {
    setFriend(null);
    setMessages([]);
    setError("");
    getProfile(username)
      .then(async (profile) => {
        setFriend(profile);
        if (profile.relationship !== "friends") return;
        const page = await getMessages(username);
        scrollAfterRender.current = { toBottom: true };
        setMessages(page);
        setHasOlder(page.length === MESSAGE_PAGE_SIZE);
        send("messages.read", { friend: username });
      })
      .catch((err: Error) => setError(err.message));
  }, [username, send]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const scroll = scrollAfterRender.current;
    if (!list || !scroll) return;
    list.scrollTop = "toBottom" in scroll ? list.scrollHeight : list.scrollHeight - scroll.keepFromBottom;
    scrollAfterRender.current = null;
  }, [messages]);

  const loadOlder = async () => {
    const list = listRef.current;
    if (!list || !hasOlder || loadingOlder.current || messages.length === 0) return;
    loadingOlder.current = true;
    const page = await getMessages(username, messages[0].id).finally(() => (loadingOlder.current = false));
    scrollAfterRender.current = { keepFromBottom: list.scrollHeight - list.scrollTop };
    setMessages((current) => [...page, ...current]);
    setHasOlder(page.length === MESSAGE_PAGE_SIZE);
  };

  useSocketEvent("message.new", (message) => {
    if (message.sender !== username && message.recipient !== username) return;
    scrollAfterRender.current = { toBottom: true };
    setMessages((current) => [...current, message]);
    if (message.sender === username) {
      setIsTyping(false);
      send("messages.read", { friend: username });
    }
  });

  useSocketEvent("messages.read", ({ by, ids }) => {
    if (by !== username) return;
    const readIds = new Set(ids);
    const now = new Date().toISOString();
    setMessages((current) => current.map((m) => (readIds.has(m.id) ? { ...m, read_at: now } : m)));
  });

  useSocketEvent("typing", ({ from }) => {
    if (from !== username) return;
    setIsTyping(true);
    window.clearTimeout(typingTimer.current);
    typingTimer.current = window.setTimeout(() => setIsTyping(false), TYPING_SHOW_MS);
  });

  useSocketEvent("presence", ({ username: who, online }) => {
    if (who === username) setFriend((current) => current && { ...current, is_online: online });
  });

  useSocketEvent("friend.removed", ({ user }) => {
    if (user.username === username) setFriend((current) => current && { ...current, relationship: "none" });
  });

  useSocketEvent("error", ({ detail }) => setError(detail));

  useEffect(() => () => window.clearTimeout(typingTimer.current), []);

  const handleTextChange = (value: string) => {
    setText(value);
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_SEND_INTERVAL_MS) {
      lastTypingSent.current = now;
      send("typing", { to: username });
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!text.trim()) return;
    setError("");
    send("message.send", { to: username, content: text });
    setText("");
  };

  const header = (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-3 py-3">
      <Link to="/" className="icon-btn md:hidden" title="Back to chats">
        <ArrowLeftIcon />
      </Link>
      {friend && (
        <Link to={`/users/${friend.username}`} className="min-w-0 px-1">
          <p className="flex items-center gap-2 font-semibold text-slate-900">
            <span className="truncate">{friend.display_name}</span>
            <OnlineDot online={friend.is_online} />
          </p>
          <p className="text-xs text-slate-500">
            {isTyping ? <span className="text-indigo-600">typing…</span> : friend.is_online ? "online" : "offline"}
          </p>
        </Link>
      )}
    </header>
  );

  if (!friend) {
    return (
      <>
        {header}
        <p className={`p-4 ${error ? "error" : "text-slate-500"}`}>{error || "Loading…"}</p>
      </>
    );
  }

  return (
    <>
      {header}

      <div
        ref={listRef}
        onScroll={(e) => e.currentTarget.scrollTop === 0 && loadOlder()}
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => {
          const mine = message.sender === me?.username;
          return (
            <div
              key={message.id}
              className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm whitespace-pre-wrap [overflow-wrap:anywhere] ${
                mine ? "self-end rounded-br-sm bg-indigo-600 text-white" : "self-start rounded-bl-sm bg-white text-slate-900"
              }`}
            >
              {message.content}
              <span className={`ml-2 align-bottom text-[11px] ${mine ? "text-indigo-200" : "text-slate-400"}`}>
                {formatClock(message.created_at)}
                {mine && (message.read_at ? " ✓✓" : " ✓")}
              </span>
            </div>
          );
        })}
      </div>

      <footer className="border-t border-slate-200 bg-white p-3">
        {error && <p className="error mb-2">{error}</p>}
        {friend.relationship === "friends" ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              className="input"
              placeholder="Type a message"
              value={text}
              maxLength={2000}
              onChange={(e) => handleTextChange(e.target.value)}
            />
            <button type="submit" className="btn-primary" title="Send">
              <SendIcon />
            </button>
          </form>
        ) : (
          <p className="text-center text-sm text-slate-500">You are not friends with this user.</p>
        )}
      </footer>
    </>
  );
}
