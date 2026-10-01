import type { ChatListItem, Message } from "../types";
import { request } from "./client";

export const MESSAGE_PAGE_SIZE = 30;

export const getChatList = () => request<ChatListItem[]>("/chats/");

/** Messages oldest first. Pass `before` (a message id) to load older ones. */
export const getMessages = (username: string, before?: number) =>
  request<Message[]>(
    `/chats/${encodeURIComponent(username)}/messages/${before ? `?before=${before}` : ""}`,
  );
