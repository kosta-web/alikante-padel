import type { Metadata } from "next";
import Header from "@/components/Header";
import { ArrowUpRight } from "@/components/icons";
import { getGames, getSeoPage, getSiteSettings } from "@/lib/content/queries";
import styles from "./games.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [seo, settings] = await Promise.all([getSeoPage("/games"), getSiteSettings()]);
  return {
    title: seo?.title || settings.siteTitle,
    description: seo?.description || settings.siteDescription,
  };
}

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Скоро",
  ongoing: "Идёт сейчас",
  completed: "Завершена",
  cancelled: "Отменена",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function GamesPage() {
  const games = await getGames();

  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className="container">
          <p className="eyebrow">Игры и мероприятия</p>
          <h1 className={styles.title}>Расписание игр</h1>

          {games.length === 0 ? (
            <p className={styles.empty}>Пока нет запланированных игр — загляните позже.</p>
          ) : (
            <div className={styles.grid}>
              {games.map((g) => (
                <div key={g.id} className={styles.card} data-status={g.status}>
                  <span className={styles.badge}>{STATUS_LABELS[g.status] ?? g.status}</span>
                  <span className={styles.date}>{formatDate(g.startsAt)}</span>
                  <span className={styles.cardTitle}>{g.title}</span>
                  {g.format && <span className={styles.meta}>Формат: {g.format}</span>}
                  {g.location && <span className={styles.meta}>{g.location}</span>}
                  {g.description && <p className={styles.description}>{g.description}</p>}
                  {g.spotsTotal != null && (
                    <span className={styles.meta}>
                      Мест занято: {g.spotsTaken ?? 0} / {g.spotsTotal}
                    </span>
                  )}
                  <a className={styles.cta} href={g.signupHref}>
                    Записаться
                    <ArrowUpRight style={{ width: 16, height: 16 }} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
