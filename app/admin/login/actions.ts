"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionToken, verifyPassword } from "@/lib/admin-auth";

const COOKIE_NAME = "admin_session";

export type LoginState = { error?: boolean };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");

  if (!verifyPassword(password)) {
    return { error: true };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  redirect("/admin");
}

export async function logout() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
  redirect("/admin/login");
}
