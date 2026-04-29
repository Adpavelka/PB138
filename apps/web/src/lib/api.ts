import { treaty } from "@elysiajs/eden";
import type { App } from "@pb138/server";

export const API_BASE_URL =
  import.meta.env?.PUBLIC_API_BASE_URL ?? "http://localhost:3000";

export function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const client = treaty<App>(API_BASE_URL, {
  headers: () => authHeaders(),
});
