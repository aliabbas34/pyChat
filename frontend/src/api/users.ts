import type { Me, Profile } from "../types";
import { request } from "./client";

export const getMe = () => request<Me>("/users/me/");

export const updateMe = (data: Partial<Omit<Me, "id">>) => request<Me>("/users/me/", "PATCH", data);

export const changePassword = (current_password: string, new_password: string) =>
  request<null>("/users/me/password/", "POST", { current_password, new_password });

export const searchUsers = (query: string) =>
  request<Profile[]>(`/users/search/?q=${encodeURIComponent(query)}`);

export const getProfile = (username: string) =>
  request<Profile>(`/users/${encodeURIComponent(username)}/`);
