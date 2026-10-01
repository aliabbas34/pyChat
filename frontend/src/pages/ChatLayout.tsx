import { Outlet, useMatch } from "react-router-dom";
import ChatList from "../components/ChatList";

/**
 * Split view for "/" and "/chat/:username".
 * Desktop: chat list on the left, open chat on the right.
 * Mobile: only one of them, depending on whether a chat is open.
 */
export default function ChatLayout() {
  const activeUsername = useMatch("/chat/:username")?.params.username;
  const chatOpen = activeUsername !== undefined;

  return (
    <div className="flex h-dvh bg-slate-100">
      <aside
        className={`${chatOpen ? "hidden md:flex" : "flex"} w-full flex-col border-r border-slate-200 bg-white md:w-80 lg:w-96`}
      >
        <ChatList activeUsername={activeUsername} />
      </aside>
      <section className={`${chatOpen ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
        <Outlet />
      </section>
    </div>
  );
}

export function NoChatSelected() {
  return (
    <div className="flex flex-1 items-center justify-center text-slate-400">
      Select a chat to start messaging
    </div>
  );
}
