"use client";

import ArticleForm from "@/components/admin/ArticleForm";
import styles from "@/components/admin/admin-ui.module.css";

export default function NewArticlePage() {
  return (
    <div className={styles.page}>
      <header className={styles.pageHead}>
        <h1 className={styles.pageTitle}>Новая статья</h1>
      </header>
      <ArticleForm />
    </div>
  );
}
