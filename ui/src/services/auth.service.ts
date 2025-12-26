// src/services/auth.service.ts
import { apiFetch } from "../lib/api";
import type {
  RegisterPayload,
  LoginPayload,
  AuthResponse,
} from "../types/auth";

export const authService = {
  register(payload: RegisterPayload) {
    return apiFetch<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },

  confirmEmail(userId: string, token: string) {
    return apiFetch<AuthResponse>(
      `/api/v1/auth/confirm-email?userId=${encodeURIComponent(
        userId
      )}&token=${encodeURIComponent(token)}`,
      {
        method: "GET",
      }
    );
  },

  login(payload: LoginPayload) {
    return apiFetch<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  },
};
