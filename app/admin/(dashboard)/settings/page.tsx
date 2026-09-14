"use client";

import { useEffect, useState } from "react";
import { useContent } from "@/lib/content-store";
import ImageUploader from "@/components/admin/ImageUploader";
import styles from "@/components/admin/admin-ui.module.css";

const PAGES: { slug: string; label: string }[] = [
  { slug: "/", label: "Главная" },
  { slug: "/games", label: "Игры и мероприятия" },
  { slug: "/prices", label: "Цены" },
  { slug: "/gallery", label: "Галерея" },
];

export default function SettingsPage() {
  const { settings, seoPages, updateSettings, updateSeoPage, ready } = useContent();
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (ready) setForm(settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function save() {
    await updateSettings({
      siteTitle: form.siteTitle.trim() || settings.siteTitle,
      siteDescription: form.siteDescription.trim(),
      favicon: form.favicon,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Настройки сайта</h1>
          <p className={styles.pageLead}>
            Название и описание сайта для поисковиков, а также favicon (иконка вкладки).
          </p>
        </div>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span className={styles.label}>Название сайта (title)</span>
              <input
                className={styles.input}
                value={form.siteTitle}
                onChange={(e) => setForm({ ...form, siteTitle: e.target.value })}
              />
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Описание сайта (description)</span>
              <textarea
                className={styles.textarea}
                rows={3}
                value={form.siteDescription}
                onChange={(e) => setForm({ ...form, siteDescription: e.target.value })}
              />
            </label>

            <ImageUploader
              label="Favicon"
              folder="settings"
              value={form.favicon}
              onChange={(url) => setForm({ ...form, favicon: url })}
              onClear={() => setForm({ ...form, favicon: undefined })}
              hint="Рекомендуется квадратное изображение, например 512×512."
            />

            <div className={styles.formActions}>
              <button type="button" className={styles.primaryBtn} onClick={save}>
                Сохранить
              </button>
              {saved && <span className={styles.savedHint}>Сохранено</span>}
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>SEO по страницам</h2>
            <p className={styles.pageLead}>
              Title и description для конкретных страниц — переопределяют общее название сайта
              выше. Для статьи своё SEO задаётся в самой статье.
            </p>
            <div className={styles.list} style={{ marginTop: 10 }}>
              {PAGES.map((p) => (
                <SeoPageRow
                  key={p.slug}
                  slug={p.slug}
                  label={p.label}
                  initial={seoPages.find((s) => s.pageSlug === p.slug)}
                  onSave={updateSeoPage}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SeoPageRow({
  slug,
  label,
  initial,
  onSave,
}: {
  slug: string;
  label: string;
  initial?: { title: string; description: string };
  onSave: (slug: string, patch: { title: string; description: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await onSave(slug, { title: title.trim(), description: description.trim() });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className={styles.listItem}>
      <div className={styles.formGrid}>
        <span className={styles.listTitle}>
          {label} <span className={styles.listMeta}>{slug}</span>
        </span>
        <label className={styles.field}>
          <span className={styles.label}>SEO-заголовок</span>
          <input className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className={styles.field}>
          <span className={styles.label}>SEO-описание</span>
          <textarea
            className={styles.textarea}
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <div className={styles.formActions}>
          <button type="button" className={styles.btn} onClick={save}>
            Сохранить
          </button>
          {saved && <span className={styles.savedHint}>Сохранено</span>}
        </div>
      </div>
    </div>
  );
}
