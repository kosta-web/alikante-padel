"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-store";
import type { PricePackage } from "@/lib/types";
import styles from "@/components/admin/admin-ui.module.css";

type FormValues = {
  title: string;
  price: string;
  currency: string;
  unit: string;
  description: string;
  features: string;
  featured: boolean;
  ctaLabel: string;
  ctaHref: string;
};

const emptyForm: FormValues = {
  title: "",
  price: "",
  currency: "EUR",
  unit: "",
  description: "",
  features: "",
  featured: false,
  ctaLabel: "Записаться",
  ctaHref: "#",
};

function toFormValues(p?: PricePackage): FormValues {
  return {
    title: p?.title ?? "",
    price: p?.price != null ? String(p.price) : "",
    currency: p?.currency ?? "EUR",
    unit: p?.unit ?? "",
    description: p?.description ?? "",
    features: p?.features.join("\n") ?? "",
    featured: p?.featured ?? false,
    ctaLabel: p?.ctaLabel ?? "Записаться",
    ctaHref: p?.ctaHref ?? "#",
  };
}

function formatPrice(price: number, currency: string) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency, maximumFractionDigits: 0 }).format(
      price
    );
  } catch {
    return `${price} ${currency}`;
  }
}

export default function PricesPage() {
  const { pricePackages, addPricePackage, updatePricePackage, removePricePackage, movePricePackage, ready } =
    useContent();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [error, setError] = useState("");

  const sorted = [...pricePackages].sort((a, b) => a.sortOrder - b.sortOrder);

  function startEdit(p: PricePackage) {
    setEditingId(p.id);
    setCreating(false);
    setForm(toFormValues(p));
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
    const price = Number(form.price);
    if (!form.title.trim() || !form.price || Number.isNaN(price)) {
      setError("Укажите название и цену");
      return;
    }
    setError("");
    const payload = {
      title: form.title.trim(),
      price,
      currency: form.currency.trim() || "EUR",
      unit: form.unit.trim() || undefined,
      description: form.description.trim() || undefined,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      featured: form.featured,
      ctaLabel: form.ctaLabel.trim() || "Записаться",
      ctaHref: form.ctaHref.trim() || "#",
    };
    if (editingId) await updatePricePackage(editingId, payload);
    else await addPricePackage(payload);
    cancel();
  }

  function remove(id: string, title: string) {
    if (confirm(`Удалить тариф «${title}»?`)) removePricePackage(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Цены и пакеты тренировок</h1>
          <p className={styles.pageLead}>
            Показываются в разделе «Цены» на главной и на странице /prices.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={startCreate}>
          + Добавить тариф
        </button>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <ul className={styles.list}>
          {sorted.map((p, i) => (
            <li key={p.id} className={styles.listItem}>
              {editingId === p.id ? (
                <PriceForm form={form} setForm={setForm} error={error} onSave={save} onCancel={cancel} />
              ) : (
                <div className={styles.listRow}>
                  <div className={styles.listInfo}>
                    <span className={styles.listTitle}>{p.title}</span>
                    <span className={styles.listMeta}>
                      {formatPrice(p.price, p.currency)}
                      {p.unit ? ` ${p.unit}` : ""}
                      {p.featured ? " · выделенный" : ""}
                    </span>
                  </div>
                  <div className={styles.listActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => movePricePackage(p.id, -1)}
                      disabled={i === 0}
                      aria-label="Переместить выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => movePricePackage(p.id, 1)}
                      disabled={i === sorted.length - 1}
                      aria-label="Переместить ниже"
                    >
                      ↓
                    </button>
                    <button type="button" className={styles.btn} onClick={() => startEdit(p)}>
                      Изменить
                    </button>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => remove(p.id, p.title)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {sorted.length === 0 && <p className={styles.empty}>Тарифов пока нет.</p>}
        </ul>
      )}

      {creating && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Новый тариф</h2>
          <PriceForm form={form} setForm={setForm} error={error} onSave={save} onCancel={cancel} />
        </div>
      )}
    </div>
  );
}

function PriceForm({
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
          placeholder="Пакет 10 тренировок"
        />
      </label>

      <div className={styles.formRow}>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Цена</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className={styles.input}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            placeholder="250"
          />
        </label>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Валюта</span>
          <input
            className={styles.input}
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            placeholder="EUR"
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Единица (необязательно)</span>
        <input
          className={styles.input}
          value={form.unit}
          onChange={(e) => setForm({ ...form, unit: e.target.value })}
          placeholder="за занятие / за месяц"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Описание (необязательно)</span>
        <textarea
          className={styles.textarea}
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Что входит (по одному пункту на строку)</span>
        <textarea
          className={styles.textarea}
          rows={4}
          value={form.features}
          onChange={(e) => setForm({ ...form, features: e.target.value })}
          placeholder={"10 тренировок\nГибкая запись\nПерсональный тренер"}
        />
      </label>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm({ ...form, featured: e.target.checked })}
        />
        <span>Выделенный тариф (подсвечивается на сайте)</span>
      </label>

      <div className={styles.formRow}>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Текст кнопки</span>
          <input
            className={styles.input}
            value={form.ctaLabel}
            onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
          />
        </label>
        <label className={styles.field} style={{ flex: 1 }}>
          <span className={styles.label}>Ссылка кнопки</span>
          <input
            className={styles.input}
            value={form.ctaHref}
            onChange={(e) => setForm({ ...form, ctaHref: e.target.value })}
            placeholder="#"
          />
        </label>
      </div>

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
