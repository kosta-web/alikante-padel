"use client";

import { useState } from "react";
import { useContent } from "@/lib/content-store";
import styles from "@/components/admin/admin-ui.module.css";

export default function CategoriesPage() {
  const {
    articleCategories,
    articles,
    addArticleCategory,
    renameArticleCategory,
    removeArticleCategory,
    ready,
  } = useContent();
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  function usageCount(id: string) {
    return articles.filter((a) => a.categoryId === id).length;
  }

  function add() {
    const label = newLabel.trim();
    if (!label) return;
    addArticleCategory(label);
    setNewLabel("");
  }

  function save() {
    if (!editingId) return;
    const label = editingLabel.trim();
    if (label) renameArticleCategory(editingId, label);
    setEditingId(null);
  }

  function remove(id: string, label: string) {
    const count = usageCount(id);
    const message = count
      ? `Категория «${label}» используется в ${count} новост${count === 1 ? "и" : "ях"}. Удалить? Эти новости останутся без категории.`
      : `Удалить категорию «${label}»?`;
    if (confirm(message)) removeArticleCategory(id);
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.pageTitle}>Категории блога</h1>
          <p className={styles.pageLead}>
            Категории используются как теги и фильтры в разделе «Новости».
          </p>
        </div>
      </header>

      {!ready ? (
        <p className={styles.empty}>Загрузка…</p>
      ) : (
        <>
          {articleCategories.length === 0 ? (
            <p className={styles.empty}>Категорий пока нет — добавьте первую ниже.</p>
          ) : (
            <ul className={styles.list}>
              {articleCategories.map((c) => (
                <li key={c.id} className={styles.listItem}>
                  <div className={styles.listRow}>
                    {editingId === c.id ? (
                      <input
                        className={styles.input}
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className={styles.listInfo}>
                        <span className={styles.listTitle}>{c.label}</span>
                        <span className={styles.listMeta}>
                          {usageCount(c.id)} новост{usageCount(c.id) === 1 ? "ь" : "ей"}
                        </span>
                      </div>
                    )}
                    <div className={styles.listActions}>
                      {editingId === c.id ? (
                        <>
                          <button type="button" className={styles.primaryBtn} onClick={save}>
                            Сохранить
                          </button>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => setEditingId(null)}
                          >
                            Отмена
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={styles.btn}
                            onClick={() => {
                              setEditingId(c.id);
                              setEditingLabel(c.label);
                            }}
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            className={styles.btnDanger}
                            onClick={() => remove(c.id, c.label)}
                          >
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Новая категория</h2>
            <div className={styles.formRow}>
              <input
                className={styles.input}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Например, «Экипировка»"
                onKeyDown={(e) => e.key === "Enter" && add()}
              />
              <button type="button" className={styles.primaryBtn} onClick={add}>
                Добавить
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
