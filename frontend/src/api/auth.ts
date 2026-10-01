import type { Tokens } from "../types";
import { request } from "./client";

export interface SignupData {
  username: string;
  display_name: string;
  email: string;
  password: string;
}

export const signup = (data: SignupData) => request<Tokens>("/auth/signup/", "POST", data);

export const login = (username: string, password: string) =>
  request<Tokens>("/auth/login/", "POST", { username, password });
