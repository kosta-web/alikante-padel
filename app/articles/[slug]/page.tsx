import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { ArrowLeft } from "@/components/icons";
import { getArticleBySlug, getArticleCategories } from "@/lib/content/queries";
import styles from "./Article.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, articleCategories] = await Promise.all([
    getArticleBySlug(slug),
    getArticleCategories(),
  ]);

  if (!article) {
    return (
      <>
        <Header />
        <main className={styles.notFound}>
          <div className="container">
            <p>Статья не найдена.</p>
            <Link href="/" className="ghostLink">
              На главную
            </Link>
          </div>
        </main>
      </>
    );
  }

  const categoryLabel =
    articleCategories.find((c) => c.id === article.categoryId)?.label ?? "Без категории";

  return (
    <>
      <Header />
      <main className={styles.article}>
        <div className="container">
          <Link href="/" className={styles.back}>
            <ArrowLeft /> На главную
          </Link>
          <p className={styles.category}>{categoryLabel}</p>
          <h1 className={styles.title}>{article.title}</h1>
          <p className={styles.date}>
            {new Date(article.publishedAt).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          {article.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={article.image} alt="" className={styles.image} />
          )}
          <div className={styles.body}>
            {article.body.split(/\n{2,}/).map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
