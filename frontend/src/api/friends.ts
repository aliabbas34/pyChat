import type { FriendRequests } from "../types";
import { request } from "./client";

const user = (username: string) => encodeURIComponent(username);

export const getRequests = () => request<FriendRequests>("/friends/requests/");

export const sendRequest = (username: string) =>
  request<null>("/friends/requests/", "POST", { username });

export const acceptRequest = (username: string) =>
  request<null>(`/friends/requests/${user(username)}/accept/`, "POST");

export const rejectRequest = (username: string) =>
  request<null>(`/friends/requests/${user(username)}/reject/`, "POST");

export const cancelRequest = (username: string) =>
  request<null>(`/friends/requests/${user(username)}/cancel/`, "POST");

export const unfriend = (username: string) => request<null>(`/friends/${user(username)}/`, "DELETE");
