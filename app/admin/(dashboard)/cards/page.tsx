"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-store";
import type { Card } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";
import styles from "@/components/admin/admin-ui.module.css";

type FormValues = {
  label: string;
  title: string;
  subtitle: string;
  href: string;
  image: string;
  featured: boolean;
};

const emptyForm: FormValues = {
  label: "",
  title: "",
  subtitle: "",
  href: "#",
  image: "",
  featured: false,
};

export default function CardsPage() {
  const { cards, addCard, updateCard, removeCard, moveCard, ready } = useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);

  const sorted = [...cards].sort((a, b) => a.sortOrder - b.sortOrder);

  function startEdit(card: Card) {
    setEditingId(card.id);
    setCreating(false);
    setForm({
      label: card.label,
      title: card.title,
      subtitle: card.subtitle ?? "",
      href: card.href,
      image: card.image ?? "",
      featured: !!card.featured,
    });
  }

  function startCreate() {
    setCreating(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function cancel() {
    setCreating(false);
    setEditingId(null);
  }

  function save() {
    if (!form.label.trim() || !form.title.trim()) return;
    const payload = {
      label: form.label.trim(),
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      href: form.href.trim() || "#",
      image: form.image,
      featured: form.featured,
    };
    if (editingId) updateCard(editingId, payload);
    else addCard(payload);
    cancel();
  }

  function remove(id: string) {
    if (confirm("Удалить эту карточку с главного экрана?")) removeCard(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Карточки главного экрана</h1>
          <p className={styles.pageLead}>
            Турниры, тренировки, ближайшая игра, «Найти партнёра» и другие карточки на
            первом экране сайта.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startCreate}>
          + Добавить карточку
        </button>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((card, i) => (
            <li key={card.id} className={styles.listItem}>
              {editingId === card.id ? (
                <CardForm form={form} setForm={setForm} onSave={save} onCancel={cancel} />
              ) : (
                <div className={styles.listRow}>
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image} alt="" className={styles.thumb} />
                  ) : (
                    <div className={styles.thumbPlaceholder} />
                  )}
                  <div className={styles.listInfo}>
                    <span className={styles.listTitle}>{card.title}</span>
                    <span className={styles.listMeta}>
                      {card.label}
                      {card.featured ? " · крупная карточка" : ""}
                    </span>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveCard(card.id, -1)}
                      disabled={i === 0}
                      aria-label="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveCard(card.id, 1)}
                      disabled={i === sorted.length - 1}
                      aria-label="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button type="button" className={styles.btn} onClick={() => startEdit(card)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => remove(card.id)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Новая карточка</h2>
          <CardForm form={form} setForm={setForm} onSave={save} onCancel={cancel} />
        </div>
      )}
    </div>
  );
}

function CardForm({
  form,
  setForm,
  onSave,
  onCancel,
}: {
  form: FormValues;
  setForm: (f: FormValues) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.formGrid}>
      <label className={styles.field}>
        <span className={styles.label}>Пилюля (короткая метка)</span>
        <input
          className={styles.input}
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Турниры"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Заголовок карточки</span>
        <input
          className={styles.input}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Турниры"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Подзаголовок (необязательно)</span>
        <input
          className={styles.input}
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          placeholder="Среда · 19:30–21:30"
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Ссылка</span>
        <input
          className={styles.input}
          value={form.href}
          onChange={(e) => setForm({ ...form, href: e.target.value })}
          placeholder="#"
        />
      </label>
      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
        <span>Крупная карточка (как «Ближайшая игра»)</span>
      </label>
      <ImageUploader
        label="Фото карточки"
        folder="cards"
        value={form.image}
        onChange={(dataUrl) => setForm({ ...form, image: dataUrl })}
        onClear={() => setForm({ ...form, image: "" })}
      />
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
