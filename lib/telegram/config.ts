import "server-only";
import crypto from "crypto";

/* ------------------------------------------------------------------
   Переменные Telegram-бота. Читаются лениво, а не на импорте: на
   Vercel модуль подхватывается и при сборке, где переменных ещё нет,
   и падать в этот момент незачем.
------------------------------------------------------------------ */

export function botToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
  return token;
}

/** Telegram ID тех, кому разрешено редактировать. Всем остальным бот молчит. */
export function adminIds(): number[] {
  return (process.env.TELEGRAM_ADMIN_IDS ?? "")
    .split(/[\s,]+/)
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0);
}

export function isAdmin(userId: number | undefined): boolean {
  if (!userId) return false;
  return adminIds().includes(userId);
}

/**
 * Сверяет заголовок `X-Telegram-Bot-Api-Secret-Token`, который Telegram шлёт
 * с каждым обновлением. Без этого на вебхук сможет постучаться кто угодно,
 * узнавший URL. Сравнение постоянное по времени — как в `admin-auth.ts`.
 */
export function verifyWebhookSecret(header: string | null): boolean {
  const expected = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expected || !header) return false;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
