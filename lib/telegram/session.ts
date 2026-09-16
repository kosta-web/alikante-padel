import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/* ------------------------------------------------------------------
   Состояние диалога. Вебхук на Vercel живёт один запрос, в памяти между
   сообщениями ничего не остаётся — поэтому «какой раздел открыт», «какая
   запись выбрана» и «какое поле сейчас вводится» лежат в Supabase
   (таблица `telegram_sessions`, миграция 0003).
------------------------------------------------------------------ */

export type TgState = {
  /** Открытый раздел: prices, news, games, gallery, seo, settings, cards. */
  section?: string;
  /** id выбранной записи внутри раздела. */
  itemId?: string;
  /** Ключ поля, значение которого ждём следующим сообщением. */
  awaiting?: string;
  /** Черновик незавершённого сценария — например, загрузки фото. */
  draft?: Record<string, unknown>;
  /** id сообщения с меню, чтобы править его на месте, а не слать новое. */
  menuMessageId?: number;
};

export async function loadState(chatId: number): Promise<TgState> {
  const { data, error } = await createAdminClient()
    .from("telegram_sessions")
    .select("state")
    .eq("chat_id", chatId)
    .maybeSingle();
  if (error) throw error;
  return (data?.state as TgState) ?? {};
}

export async function saveState(chatId: number, state: TgState): Promise<void> {
  const { error } = await createAdminClient()
    .from("telegram_sessions")
    .upsert({ chat_id: chatId, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}
