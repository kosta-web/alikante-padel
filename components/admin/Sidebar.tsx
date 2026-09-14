"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";
import styles from "./AdminShell.module.css";

const links = [
  { href: "/admin", label: "Главная" },
  { href: "/admin/cards", label: "Карточки" },
  { href: "/admin/games", label: "Игры" },
  { href: "/admin/prices", label: "Цены" },
  { href: "/admin/gallery", label: "Галерея" },
  { href: "/admin/news", label: "Новости" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/settings", label: "Настройки" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        Top Padel
        <span>Админка</span>
      </div>

      <nav className={styles.nav} aria-label="Разделы админки">
        {links.map((link) => {
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              data-active={active || undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logout} className={styles.logoutForm}>
        <button type="submit" className={styles.logoutBtn}>
          Выйти
        </button>
      </form>
    </aside>
  );
}
