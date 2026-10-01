export type Relationship = "self" | "none" | "sent" | "received" | "friends";

export interface User {
  id: number;
  username: string;
  display_name: string;
  bio: string;
}

export interface Me extends User {
  email: string;
}

export interface Profile extends User {
  relationship: Relationship;
  is_online: boolean;
}

export interface ChatListItem {
  id: number;
  username: string;
  display_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  is_online: boolean;
}

export interface Message {
  id: number;
  sender: string;
  recipient: string;
  content: string;
  created_at: string;
  read_at: string | null;
}

export interface FriendRequests {
  incoming: User[];
  outgoing: User[];
}

export interface Tokens {
  access: string;
  refresh: string;
}

/** Events pushed by the server over the WebSocket, keyed by type. */
export interface ServerEvents {
  "message.new": Message;
  "messages.read": { by: string; ids: number[] };
  typing: { from: string };
  presence: { username: string; online: boolean };
  "friend_request.new": { user: User };
  "friend_request.accepted": { user: User };
  "friend_request.rejected": { user: User };
  "friend_request.cancelled": { user: User };
  "friend.removed": { user: User };
  error: { detail: string };
}

/** Events the client sends over the WebSocket, keyed by type. */
export interface ClientEvents {
  "message.send": { to: string; content: string };
  typing: { to: string };
  "messages.read": { friend: string };
}
