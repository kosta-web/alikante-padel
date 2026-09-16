import "server-only";
import { readAdminContent, uploadImageBytes } from "@/lib/content/core";
import * as core from "@/lib/content/core";
import type { AdminContent } from "@/lib/content/core";
import {
  answerCallback,
  downloadFile,
  editMessage,
  esc,
  sendMessage,
  type InlineKeyboard,
  type TgMessage,
  type TgUpdate,
} from "./api";
import { isAdmin } from "./config";
import { clip, parseDate, parseDateTime, parseNumber } from "./format";
import { loadState, saveState, type TgState } from "./session";
import { field, MAIN_MENU, section, showValue, SECTIONS, type FieldSpec, type SectionSpec } from "./sections";

/* ------------------------------------------------------------------
   Разбор обновлений Telegram и отрисовка экранов.

   Экран один и тот же сообщение: нажатия на кнопки правят его на месте
   (`editMessage`), а после введённого текста шлётся новое — иначе меню
   оказывалось бы выше вашего ответа и читалось задом наперёд.

   Доступ проверяется по `from.id`: посторонним бот не отвечает вовсе,
   а не пишет «нельзя», — молчание не подсказывает, что здесь админка.
------------------------------------------------------------------ */

const ROWS_LIMIT = 24;

/* -------------------------------------------------------------- клавиатуры */

function mainKeyboard(): InlineKeyboard {
  const rows: InlineKeyboard = [];
  for (let i = 0; i < MAIN_MENU.length; i += 2) {
    rows.push(
      MAIN_MENU.slice(i, i + 2)
        .map((id) => SECTIONS.find((s) => s.id === id))
        .filter((s): s is SectionSpec => Boolean(s))
        .map((s) => ({ text: s.label, callback_data: `s:${s.id}` }))
    );
  }
  return rows;
}

async function showMain(chatId: number, state: TgState, edit = false) {
  const text =
    "<b>Админка TOP PADEL</b>\n\nВыберите раздел. Отменить ввод в любой момент — /cancel.";
  await render(chatId, state, text, mainKeyboard(), edit);
  state.section = undefined;
  state.itemId = undefined;
  state.awaiting = undefined;
  state.draft = undefined;
}

async function showList(chatId: number, state: TgState, spec: SectionSpec, content: AdminContent, edit = true) {
  state.section = spec.id;
  state.itemId = undefined;
  state.awaiting = undefined;

  if (spec.single) {
    await showItem(chatId, state, spec, content, "site", edit);
    return;
  }

  const items = spec.list(content);
  const shown = items.slice(0, ROWS_LIMIT);
  const rows: InlineKeyboard = shown.map((item) => [
    { text: item.title, callback_data: `i:${item.id}` },
  ]);

  const tail: InlineKeyboard[number] = [];
  if (spec.create) tail.push({ text: "➕ Добавить", callback_data: "n" });
  tail.push({ text: "‹ Разделы", callback_data: "m" });
  rows.push(tail);
  for (const related of spec.related ?? []) {
    rows.push([{ text: related.label, callback_data: `s:${related.id}` }]);
  }

  let text = `<b>${esc(spec.label)}</b>`;
  if (!items.length) text += `\n\n${esc(spec.emptyHint ?? "Пока пусто.")}`;
  if (items.length > shown.length) {
    text += `\n\nПоказаны первые ${shown.length} из ${items.length} — остальные правьте в веб-админке.`;
  }
  if (spec.id === "gallery") text += "\n\nЧтобы добавить фото — просто пришлите его сюда.";

  await render(chatId, state, text, rows, edit);
}

async function showItem(
  chatId: number,
  state: TgState,
  spec: SectionSpec,
  content: AdminContent,
  id: string,
  edit = true
) {
  const item = spec.read(content, id);
  if (!item) {
    await showList(chatId, state, spec, content, edit);
    return;
  }

  state.section = spec.id;
  state.itemId = id;
  state.awaiting = undefined;

  const specs = spec.fields(content);
  const lines = specs.map((f) => `${esc(f.label)}: <b>${esc(showValue(f, item[f.key]))}</b>`);
  const text = `<b>${esc(spec.label)}</b>\n\n${lines.join("\n")}\n\nЧто меняем?`;

  const rows: InlineKeyboard = [];
  for (let i = 0; i < specs.length; i += 2) {
    rows.push(specs.slice(i, i + 2).map((f) => ({ text: f.label, callback_data: `f:${f.key}` })));
  }

  const controls: InlineKeyboard[number] = [];
  if (spec.move) {
    controls.push({ text: "↑", callback_data: "u" }, { text: "↓", callback_data: "w" });
  }
  if (spec.remove) controls.push({ text: "🗑 Удалить", callback_data: "d" });
  if (controls.length) rows.push(controls);
  rows.push([
    ...(spec.single ? [] : [{ text: "‹ Список", callback_data: `s:${spec.id}` }]),
    { text: "‹ Разделы", callback_data: "m" },
  ]);

  await render(chatId, state, text, rows, edit);
}

async function showField(
  chatId: number,
  state: TgState,
  spec: SectionSpec,
  content: AdminContent,
  f: FieldSpec
) {
  const item = state.itemId ? spec.read(content, state.itemId) : undefined;
  const current = item ? showValue(f, item[f.key]) : "—";

  // Значения из списка выбираются кнопкой — просить их текстом бессмысленно.
  if (f.type === "choice" || f.type === "bool") {
    const choices =
      f.type === "bool"
        ? [
            { value: "1", label: "Да" },
            { value: "0", label: "Нет" },
          ]
        : f.choices ?? [];
    const rows: InlineKeyboard = choices.map((c) => [
      { text: c.label, callback_data: `v:${f.key}:${c.value}` },
    ]);
    rows.push([{ text: "‹ Назад", callback_data: "x" }]);
    await render(
      chatId,
      state,
      `<b>${esc(f.label)}</b>\nСейчас: <b>${esc(current)}</b>\n\nВыберите значение.`,
      rows,
      true
    );
    return;
  }

  // Картинку не вводят текстом — её присылают следующим сообщением.
  if (f.type === "image") {
    state.awaiting = f.key;
    const url = item?.[f.key] ? String(item[f.key]) : "";
    const rows: InlineKeyboard = [];
    if (url && !f.required) {
      rows.push([{ text: "🗑 Убрать картинку", callback_data: `v:${f.key}:` }]);
    }
    rows.push([{ text: "‹ Назад", callback_data: "x" }]);
    await render(
      chatId,
      state,
      url
        ? `<b>${esc(f.label)}</b>\n\n<a href="${esc(url)}">Текущая картинка</a>\n\n` +
            "Пришлите новую — она заменит эту."
        : `<b>${esc(f.label)}</b>\nСейчас: <b>—</b>\n\nПришлите картинку сообщением.`,
      rows,
      true
    );
    return;
  }

  state.awaiting = f.key;
  const hints: string[] = [];
  if (f.hint) hints.push(esc(f.hint));
  if (f.type === "lines") hints.push("По пункту на строку.");
  if (f.type === "date") hints.push("Формат: 20.09.2026");
  if (f.type === "datetime") hints.push("Формат: 20.09.2026 18:30");
  hints.push("Очистить поле — /clear, отменить — /cancel.");

  await render(
    chatId,
    state,
    `<b>${esc(f.label)}</b>\nСейчас: <b>${esc(current)}</b>\n\nПришлите новое значение.\n<i>${hints.join(" ")}</i>`,
    [[{ text: "‹ Назад", callback_data: "x" }]],
    true
  );
}

/* ------------------------------------------------------------------ разбор */

function parseValue(f: FieldSpec, raw: string): unknown {
  if (raw.trim() === "/clear") {
    if (f.required) throw new Error("Это поле нельзя оставить пустым.");
    if (f.type === "lines") return [];
    if (f.type === "number" || f.type === "image") return null;
    return "";
  }
  if (f.type === "image") {
    throw new Error("Сюда нужно прислать картинку, а не текст.");
  }
  switch (f.type) {
    case "number":
      return parseNumber(raw);
    case "date":
      return parseDate(raw);
    case "datetime":
      return parseDateTime(raw);
    case "lines":
      return raw
        .split("\n")
        .map((line) => line.replace(/^[-–—•\s]+/, "").trim())
        .filter(Boolean);
    case "longtext":
      return raw.trim();
    default: {
      const value = raw.trim();
      if (!value) throw new Error("Пустое значение. Чтобы очистить поле, пришлите /clear.");
      return value;
    }
  }
}

/* --------------------------------------------------------------- отрисовка */

/**
 * Рисует экран: правит уже показанное меню или шлёт новое и запоминает его id.
 * Если Telegram отказался править (сообщение слишком старое или удалено),
 * отправляем новое — иначе нажатие просто ничего бы не сделало.
 */
async function render(
  chatId: number,
  state: TgState,
  text: string,
  keyboard: InlineKeyboard,
  edit: boolean
) {
  if (edit && state.menuMessageId) {
    try {
      await editMessage(chatId, state.menuMessageId, text, keyboard);
      return;
    } catch {
      // упадём ниже, в отправку нового
    }
  }
  const sent = await sendMessage(chatId, text, keyboard);
  state.menuMessageId = sent.message_id;
}

/* ----------------------------------------------------------------- события */

async function onCallback(chatId: number, state: TgState, data: string) {
  const content = await readAdminContent();
  const spec = section(state.section);

  if (data === "m") return showMain(chatId, state, true);

  if (data.startsWith("s:")) {
    const next = section(data.slice(2));
    if (next) return showList(chatId, state, next, content, true);
    return;
  }

  if (!spec) return showMain(chatId, state, true);

  if (data.startsWith("i:")) return showItem(chatId, state, spec, content, data.slice(2), true);

  if (data === "x") {
    state.awaiting = undefined;
    return state.itemId
      ? showItem(chatId, state, spec, content, state.itemId, true)
      : showList(chatId, state, spec, content, true);
  }

  if (data === "n" && spec.create) {
    state.itemId = undefined;
    state.awaiting = "__new__";
    return render(
      chatId,
      state,
      `<b>${esc(spec.label)}</b>\n\n${esc(spec.create.prompt)}\n<i>Отменить — /cancel.</i>`,
      [[{ text: "‹ Назад", callback_data: `s:${spec.id}` }]],
      true
    );
  }

  if (data.startsWith("f:")) {
    const f = field(spec, content, data.slice(2));
    if (f) return showField(chatId, state, spec, content, f);
    return;
  }

  if (data.startsWith("v:")) {
    const rest = data.slice(2);
    const sep = rest.indexOf(":");
    const key = rest.slice(0, sep);
    const raw = rest.slice(sep + 1);
    const f = field(spec, content, key);
    if (!f || !state.itemId) return;
    // Пустой raw приходит с кнопки «убрать картинку» и со «без категории».
    const value = f.type === "bool" ? raw === "1" : raw || null;
    await spec.apply(state.itemId, { [key]: value });
    return showItem(chatId, state, spec, await readAdminContent(), state.itemId, true);
  }

  if ((data === "u" || data === "w") && spec.move && state.itemId) {
    await spec.move(state.itemId, data === "u" ? -1 : 1);
    return showItem(chatId, state, spec, await readAdminContent(), state.itemId, true);
  }

  if (data === "d" && spec.remove && state.itemId) {
    return render(
      chatId,
      state,
      "<b>Удалить запись?</b>\n\nОтменить это будет нельзя.",
      [
        [
          { text: "🗑 Да, удалить", callback_data: "dy" },
          { text: "‹ Отмена", callback_data: "x" },
        ],
      ],
      true
    );
  }

  if (data === "dy" && spec.remove && state.itemId) {
    await spec.remove(state.itemId);
    state.itemId = undefined;
    return showList(chatId, state, spec, await readAdminContent(), true);
  }
}

async function onText(chatId: number, state: TgState, text: string) {
  const command = text.trim().toLowerCase();

  if (command === "/start" || command === "/menu") {
    state.menuMessageId = undefined;
    return showMain(chatId, state, false);
  }

  if (command === "/cancel") {
    state.awaiting = undefined;
    state.draft = undefined;
    state.menuMessageId = undefined;
    await sendMessage(chatId, "Отменил.");
    return showMain(chatId, state, false);
  }

  const spec = section(state.section);
  if (!spec || !state.awaiting) {
    state.menuMessageId = undefined;
    return showMain(chatId, state, false);
  }

  const content = await readAdminContent();

  // Создание новой записи: одно поле сейчас, остальные — правкой карточки.
  if (state.awaiting === "__new__" && spec.create) {
    const title = text.trim();
    if (!title) return sendMessage(chatId, "Пустое название. Пришлите текст ещё раз.");
    const id = await spec.create.run(title);
    state.awaiting = undefined;
    state.menuMessageId = undefined;
    await sendMessage(chatId, "✅ Создано. Дозаполните поля:");
    return showItem(chatId, state, spec, await readAdminContent(), id, false);
  }

  const f = field(spec, content, state.awaiting);
  if (!f || !state.itemId) {
    state.awaiting = undefined;
    return showList(chatId, state, spec, content, false);
  }

  let value: unknown;
  try {
    value = parseValue(f, text);
  } catch (cause) {
    // Ошибка разбора — не сбой: поле остаётся открытым, чтобы можно было
    // просто прислать значение ещё раз.
    return sendMessage(chatId, `⚠️ ${esc((cause as Error).message)}\nПришлите значение ещё раз.`);
  }

  await spec.apply(state.itemId, { [f.key]: value });
  state.awaiting = undefined;
  state.menuMessageId = undefined;
  await sendMessage(chatId, `✅ ${esc(f.label)} — сохранено.`);
  return showItem(chatId, state, spec, await readAdminContent(), state.itemId, false);
}

/** Фото из чата → Storage → новая запись в галерее, сразу с выбором категории. */
async function onPhoto(chatId: number, state: TgState, message: TgMessage) {
  const largest = message.photo?.[message.photo.length - 1];
  // Файлом можно прислать картинку без сжатия — но только картинку.
  const asDocument =
    message.document?.mime_type?.startsWith("image/") ? message.document : undefined;
  const fileId = largest?.file_id ?? asDocument?.file_id;
  if (!fileId) {
    if (message.document) {
      await sendMessage(chatId, "Это не изображение — такой файл не подойдёт.");
    }
    return;
  }

  // Открыто поле-картинка (у статьи, игры, карточки) — фото идёт туда.
  const openSpec = section(state.section);
  const openField = openSpec && state.awaiting
    ? field(openSpec, await readAdminContent(), state.awaiting)
    : undefined;

  if (openSpec && openField?.type === "image" && state.itemId) {
    await sendMessage(chatId, "Загружаю картинку…");
    const file = await downloadFile(fileId);
    const url = await uploadImageBytes(openField.folder ?? "gallery", file.bytes, {
      contentType: file.contentType,
      ext: file.ext,
    });
    await openSpec.apply(state.itemId, { [openField.key]: url });
    state.awaiting = undefined;
    state.menuMessageId = undefined;
    await sendMessage(chatId, `✅ ${esc(openField.label)} — сохранена.`);
    return showItem(chatId, state, openSpec, await readAdminContent(), state.itemId, false);
  }

  // Иначе фото само по себе — это новая строка галереи.
  await sendMessage(chatId, "Загружаю фото…");
  const file = await downloadFile(fileId);
  const url = await uploadImageBytes("gallery", file.bytes, {
    contentType: file.contentType,
    ext: file.ext,
  });

  const caption = message.caption?.trim();
  const id = await core.createGalleryPhoto({
    categoryId: null,
    image: url,
    caption: caption || undefined,
    alt: caption || undefined,
  });

  const spec = section("gallery")!;
  state.section = "gallery";
  state.itemId = id;
  state.menuMessageId = undefined;

  await sendMessage(chatId, "✅ Фото в галерее.");
  const content = await readAdminContent();
  const categoryField = field(spec, content, "categoryId");
  if (categoryField) {
    // Категорию спрашиваем сразу: без неё фото не попадёт ни в одну вкладку
    // на /gallery, и об этом легко забыть.
    await showField(chatId, state, spec, content, categoryField);
  } else {
    await showItem(chatId, state, spec, content, id, false);
  }
}

/* ------------------------------------------------------------------- вход */

export async function handleUpdate(update: TgUpdate): Promise<void> {
  const from = update.message?.from?.id ?? update.callback_query?.from.id;
  const chatId = update.message?.chat.id ?? update.callback_query?.message?.chat.id;
  if (!chatId || !isAdmin(from)) return;

  let state: TgState;
  try {
    state = await loadState(chatId);
  } catch (cause) {
    console.error("[telegram] не читается telegram_sessions:", cause);
    await sendMessage(
      chatId,
      "⚠️ Не найдена таблица состояния диалога.\n\nВыполните миграцию " +
        "<code>supabase/migrations/0003_telegram_sessions.sql</code> в SQL Editor Supabase."
    );
    return;
  }

  try {
    if (update.callback_query) {
      await answerCallback(update.callback_query.id);
      if (update.callback_query.message) state.menuMessageId = update.callback_query.message.message_id;
      if (update.callback_query.data) await onCallback(chatId, state, update.callback_query.data);
    } else if (update.message?.photo || update.message?.document) {
      await onPhoto(chatId, state, update.message);
    } else if (update.message?.text) {
      await onText(chatId, state, update.message.text);
    }
  } catch (cause) {
    console.error("[telegram] сбой обработки:", cause);
    const reason = cause instanceof Error ? cause.message : String(cause);
    await sendMessage(chatId, `⚠️ Не получилось: ${esc(clip(reason, 200))}\n\nМеню — /start.`);
  } finally {
    await saveState(chatId, state);
  }
}
