import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from "react";
import { API_URL, refreshAccessToken, tokenStore } from "../api/client";
import type { ClientEvents, ServerEvents } from "../types";
import { useAuth } from "./AuthContext";

type Handler<K extends keyof ServerEvents> = (data: ServerEvents[K]) => void;

interface SocketContextValue {
  subscribe: <K extends keyof ServerEvents>(type: K, handler: Handler<K>) => () => void;
  send: <K extends keyof ClientEvents>(type: K, data: ClientEvents[K]) => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const WS_URL = API_URL.replace(/^http/, "ws");
const RECONNECT_DELAY_MS = 2000;

/** Keeps one WebSocket open while logged in and fans events out to subscribers. */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { me, logout } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(new Map<string, Set<(data: unknown) => void>>());
  const pendingRef = useRef<string[]>([]);
  const userId = me?.id;

  useEffect(() => {
    if (!userId) return;
    let stopped = false;
    let retryTimer: number | undefined;

    const open = () => {
      const socket = new WebSocket(`${WS_URL}/ws/?token=${tokenStore.access()}`);
      socket.onopen = () => {
        pendingRef.current.forEach((event) => socket.send(event));
        pendingRef.current = [];
      };
      socket.onmessage = (message) => {
        const { type, data } = JSON.parse(message.data);
        handlersRef.current.get(type)?.forEach((handler) => handler(data));
      };
      socket.onclose = () => {
        if (!stopped) scheduleReconnect();
      };
      socketRef.current = socket;
    };

    // The access token may have expired: refresh it, then reconnect.
    // If the server is unreachable, the refresh throws and we simply try again later.
    const scheduleReconnect = () => {
      retryTimer = window.setTimeout(async () => {
        if (stopped) return;
        try {
          if (await refreshAccessToken()) open();
          else logout();
        } catch {
          scheduleReconnect();
        }
      }, RECONNECT_DELAY_MS);
    };

    open();
    return () => {
      stopped = true;
      pendingRef.current = [];
      window.clearTimeout(retryTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [userId, logout]);

  // Only reads refs, so the value never changes and subscribers don't re-subscribe.
  const value = useMemo<SocketContextValue>(
    () => ({
      subscribe: (type, handler) => {
        const handlers = handlersRef.current;
        if (!handlers.has(type)) handlers.set(type, new Set());
        const set = handlers.get(type)!;
        const listener = handler as (data: unknown) => void;
        set.add(listener);
        return () => {
          set.delete(listener);
        };
      },
      // Events sent while (re)connecting are queued and flushed on open.
      send: (type, data) => {
        const event = JSON.stringify({ type, data });
        const socket = socketRef.current;
        if (socket?.readyState === WebSocket.OPEN) socket.send(event);
        else pendingRef.current.push(event);
      },
    }),
    [],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useSocket must be used inside SocketProvider");
  return context;
}

/** Run `handler` for every `type` event while the component is mounted. */
export function useSocketEvent<K extends keyof ServerEvents>(type: K, handler: Handler<K>) {
  const { subscribe } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => subscribe(type, (data) => handlerRef.current(data)), [subscribe, type]);
}
