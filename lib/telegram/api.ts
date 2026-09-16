import "server-only";
import { botToken } from "./config";

/* ------------------------------------------------------------------
   Тонкий клиент Bot API поверх fetch. Библиотеку не берём: боту нужны
   пять методов и никакой маршрутизации — она своя, в `bot.ts`.
------------------------------------------------------------------ */

export type InlineButton = { text: string; callback_data: string };
export type InlineKeyboard = InlineButton[][];

export type TgUpdate = {
  update_id: number;
  message?: TgMessage;
  callback_query?: {
    id: string;
    from: { id: number };
    message?: { message_id: number; chat: { id: number } };
    data?: string;
  };
};

export type TgMessage = {
  message_id: number;
  chat: { id: number };
  from?: { id: number };
  text?: string;
  caption?: string;
  photo?: { file_id: string; file_size?: number; width: number; height: number }[];
  document?: { file_id: string; mime_type?: string; file_name?: string };
};

async function call<T>(method: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${botToken()}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) throw new Error(`Telegram ${method}: ${json.description ?? res.status}`);
  return json.result as T;
}

export function sendMessage(
  chatId: number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<TgMessage> {
  return call<TgMessage>("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
  });
}

/**
 * Правит уже отправленное меню вместо новой отправки, чтобы чат не зарастал
 * копиями одного экрана. Telegram отвечает ошибкой, если текст и клавиатура
 * не изменились — это не сбой, просто глотаем.
 */
export async function editMessage(
  chatId: number,
  messageId: number,
  text: string,
  keyboard?: InlineKeyboard
): Promise<void> {
  try {
    await call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      ...(keyboard && { reply_markup: { inline_keyboard: keyboard } }),
    });
  } catch (cause) {
    if (!String(cause).includes("message is not modified")) throw cause;
  }
}

/** Гасит «часики» на нажатой кнопке; без этого она крутится ~30 секунд. */
export async function answerCallback(id: string, text?: string): Promise<void> {
  try {
    await call("answerCallbackQuery", { callback_query_id: id, ...(text && { text }) });
  } catch {
    // Кнопка протухла (>48 часов) — экран всё равно уже перерисован.
  }
}

/** Скачивает файл Telegram (фото/документ) в память. */
export async function downloadFile(
  fileId: string
): Promise<{ bytes: ArrayBuffer; ext: string; contentType: string }> {
  const file = await call<{ file_path?: string }>("getFile", { file_id: fileId });
  if (!file.file_path) throw new Error("Telegram getFile: нет file_path");

  const res = await fetch(
    `https://api.telegram.org/file/bot${botToken()}/${file.file_path}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Не удалось скачать файл: ${res.status}`);

  const ext = file.file_path.split(".").pop()?.toLowerCase() || "jpg";
  return {
    bytes: await res.arrayBuffer(),
    ext,
    contentType: res.headers.get("content-type") || `image/${ext === "jpg" ? "jpeg" : ext}`,
  };
}

/** Экранирует пользовательский текст для parse_mode: HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
