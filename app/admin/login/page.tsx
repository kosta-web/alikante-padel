"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import styles from "./Login.module.css";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className={styles.wrap}>
      <form action={formAction} className={styles.card}>
        <h1 className={styles.title}>Вход в админку</h1>
        <p className={styles.subtitle}>TOP PADEL ALICANTE</p>

        <label className={styles.field}>
          Пароль
          <input
            className={styles.input}
            type="password"
            name="password"
            autoComplete="current-password"
            autoFocus
            required
          />
        </label>

        {state?.error && <p className={styles.error}>Неверный пароль</p>}

        <button className={styles.submit} type="submit" disabled={pending}>
          {pending ? "Проверяем…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
