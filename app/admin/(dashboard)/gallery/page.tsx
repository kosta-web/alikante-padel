"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-store";
import type { GalleryPhoto } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";
import styles from "@/components/admin/admin-ui.module.css";

export default function GalleryPage() {
  const {
    galleryCategories,
    galleryPhotos,
    addGalleryCategory,
    renameGalleryCategory,
    removeGalleryCategory,
    addGalleryPhoto,
    updateGalleryPhoto,
    removeGalleryPhoto,
    moveGalleryPhoto,
    ready,
  } = useContent();

  const [newCategoryLabel, setNewCategoryLabel] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryLabel, setEditingCategoryLabel] = useState("");

  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [creatingPhoto, setCreatingPhoto] = useState(false);
  const [photoForm, setPhotoForm] = useState({ categoryId: "", image: "", alt: "", caption: "" });

  const sortedPhotos = [...galleryPhotos].sort((a, b) => a.sortOrder - b.sortOrder);

  function categoryLabel(id: string | null) {
    return galleryCategories.find((c) => c.id === id)?.label ?? "Без категории";
  }

  function addCategory() {
    const label = newCategoryLabel.trim();
    if (!label) return;
    addGalleryCategory(label);
    setNewCategoryLabel("");
  }

  function saveCategory() {
    if (!editingCategoryId) return;
    const label = editingCategoryLabel.trim();
    if (label) renameGalleryCategory(editingCategoryId, label);
    setEditingCategoryId(null);
  }

  function removeCategory(id: string, label: string) {
    if (confirm(`Удалить категорию «${label}»? Фото останутся без категории.`)) {
      removeGalleryCategory(id);
    }
  }

  function startCreatePhoto() {
    setCreatingPhoto(true);
    setEditingPhotoId(null);
    setPhotoForm({ categoryId: "", image: "", alt: "", caption: "" });
  }

  function startEditPhoto(photo: GalleryPhoto) {
    setEditingPhotoId(photo.id);
    setCreatingPhoto(false);
    setPhotoForm({
      categoryId: photo.categoryId ?? "",
      image: photo.image,
      alt: photo.alt ?? "",
      caption: photo.caption ?? "",
    });
  }

  function cancelPhoto() {
    setCreatingPhoto(false);
    setEditingPhotoId(null);
  }

  async function savePhoto() {
    if (!photoForm.image) return;
    const payload = {
      categoryId: photoForm.categoryId || null,
      image: photoForm.image,
      alt: photoForm.alt.trim() || undefined,
      caption: photoForm.caption.trim() || undefined,
    };
    if (editingPhotoId) await updateGalleryPhoto(editingPhotoId, payload);
    else await addGalleryPhoto(payload);
    cancelPhoto();
  }

  function removePhoto(id: string) {
    if (confirm("Удалить это фото из галереи?")) removeGalleryPhoto(id);
  }

  if (!ready) return <p className={styles.empty}>Загрузка…</p>;

  return (
    <div className={styles.page} style={{ maxWidth: 980 }}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Галерея</h1>
          <p className={styles.pageLead}>
            Категории и фото галереи. Показываются в разделе «Галерея» на главной и на странице
            /gallery.
          </p>
        </div>
      </header>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Категории</h2>
        <ul className={styles.list}>
          {galleryCategories.map((c) => (
            <li key={c.id} className={styles.listItem}>
              <div className={styles.listRow}>
                {editingCategoryId === c.id ? (
                  <input
                    className={styles.input}
                    value={editingCategoryLabel}
                    onChange={(e) => setEditingCategoryLabel(e.target.value)}
                    autoFocus
                  />
                ) : (
                  <div className={styles.listInfo}>
                    <span className={styles.listTitle}>{c.label}</span>
                    <span className={styles.listMeta}>
                      {galleryPhotos.filter((p) => p.categoryId === c.id).length} фото
                    </span>
                  </div>
                )}
                <div className={styles.listActions}>
                  {editingCategoryId === c.id ? (
                    <>
                      <button type="button" className={styles.primaryBtn} onClick={saveCategory}>
                        Сохранить
                      </button>
                      <button type="button" className={styles.btn} onClick={() => setEditingCategoryId(null)}>
                        Отмена
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={styles.btn}
                        onClick={() => {
                          setEditingCategoryId(c.id);
                          setEditingCategoryLabel(c.label);
                        }}
                      >
                        Переименовать
                      </button>
                      <button type="button" className={styles.btnDanger} onClick={() => removeCategory(c.id, c.label)}>
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
          {galleryCategories.length === 0 && (
            <p className={styles.empty}>Категорий пока нет — добавьте первую ниже.</p>
          )}
        </ul>
        <div className={styles.formRow}>
          <input
            className={styles.input}
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            placeholder="Например, «Турниры»"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button type="button" className={styles.primaryBtn} onClick={addCategory}>
            Добавить
          </button>
        </div>
      </div>

      <div className={styles.pageHead}>
        <h2 className={styles.cardTitle} style={{ margin: 0 }}>
          Фото
        </h2>
        <button type="button" className={styles.primaryBtn} onClick={startCreatePhoto}>
          + Добавить фото
        </button>
      </div>

      <ul className={styles.list}>
        {sortedPhotos.map((p, i) => (
          <li key={p.id} className={styles.listItem}>
            {editingPhotoId === p.id ? (
              <PhotoForm
                form={photoForm}
                setForm={setPhotoForm}
                categories={galleryCategories}
                onSave={savePhoto}
                onCancel={cancelPhoto}
              />
            ) : (
              <div className={styles.listRow}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt="" className={styles.thumb} />
                <div className={styles.listInfo}>
                  <span className={styles.listTitle}>{p.caption || categoryLabel(p.categoryId)}</span>
                  <span className={styles.listMeta}>{categoryLabel(p.categoryId)}</span>
                </div>
                <div className={styles.listActions}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => moveGalleryPhoto(p.id, -1)}
                    disabled={i === 0}
                    aria-label="Переместить выше"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => moveGalleryPhoto(p.id, 1)}
                    disabled={i === sortedPhotos.length - 1}
                    aria-label="Переместить ниже"
                  >
                    ↓
                  </button>
                  <button type="button" className={styles.btn} onClick={() => startEditPhoto(p)}>
                    Изменить
                  </button>
                  <button type="button" className={styles.btnDanger} onClick={() => removePhoto(p.id)}>
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {sortedPhotos.length === 0 && <p className={styles.empty}>Фото пока нет.</p>}
      </ul>

      {creatingPhoto && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Новое фото</h2>
          <PhotoForm
            form={photoForm}
            setForm={setPhotoForm}
            categories={galleryCategories}
            onSave={savePhoto}
            onCancel={cancelPhoto}
          />
        </div>
      )}
    </div>
  );
}

function PhotoForm({
  form,
  setForm,
  categories,
  onSave,
  onCancel,
}: {
  form: { categoryId: string; image: string; alt: string; caption: string };
  setForm: (f: { categoryId: string; image: string; alt: string; caption: string }) => void;
  categories: { id: string; label: string }[];
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.formGrid}>
      <ImageUploader
        label="Фото"
        folder="gallery"
        value={form.image}
        onChange={(url) => setForm({ ...form, image: url })}
        onClear={() => setForm({ ...form, image: "" })}
      />
      <label className={styles.field}>
        <span className={styles.label}>Категория</span>
        <select
          className={styles.input}
          value={form.categoryId}
          onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        >
          <option value="">Без категории</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Подпись (необязательно)</span>
        <input
          className={styles.input}
          value={form.caption}
          onChange={(e) => setForm({ ...form, caption: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span className={styles.label}>Альтернативный текст (необязательно)</span>
        <input
          className={styles.input}
          value={form.alt}
          onChange={(e) => setForm({ ...form, alt: e.target.value })}
        />
      </label>
      <div className={styles.formActions}>
        <button type="button" className={styles.primaryBtn} onClick={onSave} disabled={!form.image}>
          Сохранить
        </button>
        <button type="button" className={styles.btn} onClick={onCancel}>
          Отмена
        </button>
      </div>
    </div>
  );
}
