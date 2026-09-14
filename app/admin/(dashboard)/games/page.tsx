"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-store";
import type { Game, GameStatus } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";
import styles from "@/components/admin/admin-ui.module.css";

const STATUS_LABELS: Record<GameStatus, string> = {
  upcoming: "Скоро",
  ongoing: "Идёт сейчас",
  completed: "Завершена",
  cancelled: "Отменена",
};

type FormValues = {
  title: string;
  format: string;
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
  image: string;
  status: GameStatus;
  spotsTotal: string;
  spotsTaken: string;
  signupHref: string;
};

const emptyForm: FormValues = {
  title: "",
  format: "",
  startsAt: "",
  endsAt: "",
  location: "",
  description: "",
  image: "",
  status: "upcoming",
  spotsTotal: "",
  spotsTaken: "",
  signupHref: "#",
};

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string) {
  return local ? new Date(local).toISOString() : "";
}

function toFormValues(game?: Game): FormValues {
  return {
    title: game?.title ?? "",
    format: game?.format ?? "",
    startsAt: toLocalInput(game?.startsAt),
    endsAt: toLocalInput(game?.endsAt),
    location: game?.location ?? "",
    description: game?.description ?? "",
    image: game?.image ?? "",
    status: game?.status ?? "upcoming",
    spotsTotal: game?.spotsTotal != null ? String(game.spotsTotal) : "",
    spotsTaken: game?.spotsTaken != null ? String(game.spotsTaken) : "",
    signupHref: game?.signupHref ?? "#",
  };
}

export default function GamesPage() {
  const { games, addGame, updateGame, removeGame, moveGame, ready } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [error, setError] = useState("");

  const sorted = [...games].sort((a, b) => a.sortOrder - b.sortOrder);

  function startEdit(game: Game) {
    setEditingId(game.id);
    setCreating(false);
    setForm(toFormValues(game));
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
    setError("");
  }

  async function save() {
    if (!form.title.trim() || !form.startsAt) {
      setError("Укажите название и дату начала");
      return;
    }
    setError("");
    const payload = {
      title: form.title.trim(),
      format: form.format.trim() || undefined,
      startsAt: fromLocalInput(form.startsAt),
      endsAt: form.endsAt ? fromLocalInput(form.endsAt) : undefined,
      location: form.location.trim() || undefined,
      description: form.description.trim() || undefined,
      image: form.image || undefined,
      status: form.status,
      spotsTotal: form.spotsTotal ? Number(form.spotsTotal) : undefined,
      spotsTaken: form.spotsTaken ? Number(form.spotsTaken) : undefined,
      signupHref: form.signupHref.trim() || "#",
    };
    if (editingId) await updateGame(editingId, payload);
    else await addGame(payload);
    cancel();
  }

  function remove(id: string, title: string) {
    if (confirm(`Удалить игру «${title}»?`)) removeGame(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Игры и мероприятия</h1>
          <p className={styles.pageLead}>
            Турниры, мексикано и игровые встречи. Показываются в разделе «Игры» на главной и на
            странице /games.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startCreate}>
          + Добавить игру
        </button>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((g, i) => (
            <li key={g.id} className={styles.listItem}>
              {editingId === g.id ? (
                <GameForm form={form} setForm={setForm} error={error} onSave={save} onCancel={cancel} />
              ) : (
                <div className={styles.listRow}>
                  {g.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={g.image} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                  <div className={styles.listInfo}>
                    <span className={styles.listTitle}>{g.title}</span>
                    <span className={styles.listMeta}>
                      {new Date(g.startsAt).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {" · "}
                      {STATUS_LABELS[g.status]}
                    </span>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveGame(g.id, -1)}
                      disabled={i === 0}
                      aria-label="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveGame(g.id, 1)}
                      disabled={i === sorted.length - 1}
                      aria-label="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button type="button" className={styles.btn} onClick={() => startEdit(g)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => remove(g.id, g.title)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {sorted.length === 0 && <p className={styles.empty}>Игр пока нет.</p>}
        </ul>
      )}

      {creating && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Новая игра</h2>
          <GameForm form={form} setForm={setForm} error={error} onSave={save} onCancel={cancel} />
        </div>
      )}
    </div>
  );
}

function GameForm({
  form,
  setForm,
  error,
  onSave,
  onCancel,
}: {
  form: FormValues;
  setForm: (f: FormValues) => void;
  error: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.formGrid}>
      {error && <p className={styles.error}>{error}</p>}

      <label className={styles.field}>
        <span className={styles.label}>Название</span>
        <input
          className={styles.input}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Mexicano El Salt"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Формат (необязательно)</span>
        <input
          className={styles.input}
          value={form.format}
          onChange={(e) => setForm({ ...form, format: e.target.value })}
          placeholder="Americano"
        />
      </label>

      <div className={styles.formRow}>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Начало</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
          />
        </label>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Конец (необязательно)</span>
          <input
            type="datetime-local"
            className={styles.input}
            value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Место (необязательно)</span>
        <input
          className={styles.input}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Корт El Salt"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Описание (необязательно)</span>
        <textarea
          className={styles.textarea}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <ImageUploader
        label="Фото игры (необязательно)"
        folder="games"
        value={form.image}
        onChange={(url) => setForm({ ...form, image: url })}
        onClear={() => setForm({ ...form, image: "" })}
      />

      <label className={styles.field}>
        <span className={styles.label}>Статус</span>
        <select
          className={styles.input}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as GameStatus })}
        >
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <div className={styles.formRow}>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Мест всего (необязательно)</span>
          <input
            type="number"
            min={0}
            className={styles.input}
            value={form.spotsTotal}
            onChange={(e) => setForm({ ...form, spotsTotal: e.target.value })}
          />
        </label>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Занято мест (необязательно)</span>
          <input
            type="number"
            min={0}
            className={styles.input}
            value={form.spotsTaken}
            onChange={(e) => setForm({ ...form, spotsTaken: e.target.value })}
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Ссылка записи</span>
        <input
          className={styles.input}
          value={form.signupHref}
          onChange={(e) => setForm({ ...form, signupHref: e.target.value })}
          placeholder="#"
        />
      </label>

      <div className={styles.formActions}>
        <button type="button" className={styles.primaryBtn} onClick={onSave}>
          Сохранить
        </button>
        <button type="button" className={styles.btn} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
