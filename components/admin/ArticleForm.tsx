"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useContent } from "@/lib/content-store";
import type { Article } from "@/lib/types";
import ImageUploader from "@/components/admin/ImageUploader";
import styles from "@/components/admin/admin-ui.module.css";

type FormValues = {
  title: string;
  slug: string;
  categoryId: string;
  image: string;
  body: string;
  seoTitle: string;
  seoDescription: string;
  published: boolean;
};

function toFormValues(article?: Article): FormValues {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    categoryId: article?.categoryId ?? "",
    image: article?.image ?? "",
    body: article?.body ?? "",
    seoTitle: article?.seoTitle ?? "",
    seoDescription: article?.seoDescription ?? "",
    published: article?.published ?? true,
  };
}

export default function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const { articleCategories, addArticle, updateArticle, uniqueSlug } = useContent();
  const [values, setValues] = useState<FormValues>(() => toFormValues(article));
  const [slugTouched, setSlugTouched] = useState(!!article);
  const [error, setError] = useState("");

  function onTitleChange(title: string) {
    setValues((v) => ({
      ...v,
      title,
      slug: slugTouched ? v.slug : uniqueSlug(title, article?.id),
    }));
  }

  async function save() {
    if (!values.title.trim()) {
      setError("Укажите заголовок статьи");
      return;
    }
    if (!values.categoryId) {
      setError("Выберите категорию");
      return;
    }
    setError("");

    const slug = uniqueSlug(values.slug || values.title, article?.id);
    const payload: Omit<Article, "id"> = {
      title: values.title.trim(),
      slug,
      categoryId: values.categoryId,
      image: values.image,
      body: values.body.trim(),
      seoTitle: values.seoTitle.trim() || values.title.trim(),
      seoDescription: values.seoDescription.trim(),
      published: values.published,
      publishedAt: article?.publishedAt ?? new Date().toISOString().slice(0, 10),
    };

    if (article) await updateArticle(article.id, payload);
    else await addArticle(payload);

    router.push("/admin/news");
  }

  return (
    <div className={styles.formGrid}>
      {error && <p className={styles.error}>{error}</p>}

      <label className={styles.field}>
        <span className={styles.label}>Заголовок</span>
        <input
          className={styles.input}
          value={values.title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Как выбрать ракетку под свой уровень"
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Ссылка (slug)</span>
        <input
          className={styles.input}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setValues((v) => ({ ...v, slug: e.target.value }));
          }}
          placeholder="kak-vybrat-raketku"
        />
        <span className={styles.hint}>
          Адрес страницы: /articles/{values.slug || "…"}
        </span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Категория</span>
        <select
          className={styles.input}
          value={values.categoryId}
          onChange={(e) => setValues((v) => ({ ...v, categoryId: e.target.value }))}
        >
          <option value="">Выберите категорию</option>
          {articleCategories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        {articleCategories.length === 0 && (
          <span className={styles.hint}>
            Сначала создайте категорию в разделе «Категории».
          </span>
        )}
      </label>

      <ImageUploader
        label="Фото статьи"
        folder="articles"
        value={values.image}
        onChange={(dataUrl) => setValues((v) => ({ ...v, image: dataUrl }))}
        onClear={() => setValues((v) => ({ ...v, image: "" }))}
      />

      <label className={styles.field}>
        <span className={styles.label}>Текст статьи</span>
        <textarea
          className={styles.textarea}
          rows={10}
          value={values.body}
          onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
          placeholder="Текст статьи. Разделяйте абзацы пустой строкой."
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>SEO-заголовок страницы (необязательно)</span>
        <input
          className={styles.input}
          value={values.seoTitle}
          onChange={(e) => setValues((v) => ({ ...v, seoTitle: e.target.value }))}
          placeholder={values.title || "Заголовок для поисковиков"}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>SEO-описание страницы (необязательно)</span>
        <textarea
          className={styles.textarea}
          rows={3}
          value={values.seoDescription}
          onChange={(e) => setValues((v) => ({ ...v, seoDescription: e.target.value }))}
          placeholder="Краткое описание для поисковиков"
        />
      </label>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={values.published}
          onChange={(e) => setValues((v) => ({ ...v, published: e.target.checked }))}
        />
        <span>Опубликовано (видно на сайте)</span>
      </label>

      <div className={styles.formActions}>
        <button type="button" className={styles.primaryBtn} onClick={save}>
          Сохранить
        </button>
        <button type="button" className={styles.btn} onClick={() => router.push("/admin/news")}>
          Отмена
        </button>
      </div>
    </div>
  );
}
