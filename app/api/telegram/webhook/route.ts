import { handleUpdate } from "@/lib/telegram/bot";
import { verifyWebhookSecret } from "@/lib/telegram/config";
import type { TgUpdate } from "@/lib/telegram/api";

/* ------------------------------------------------------------------
   Точка, на которую Telegram присылает сообщения (setWebhook).

   Node-рантайм, а не edge: и Supabase service-role клиент, и разбор
   скачанных файлов рассчитаны на Node.
------------------------------------------------------------------ */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyWebhookSecret(request.headers.get("x-telegram-bot-api-secret-token"))) {
    return new Response("forbidden", { status: 403 });
  }

  let update: TgUpdate;
  try {
    update = (await request.json()) as TgUpdate;
  } catch {
    return new Response("bad request", { status: 400 });
  }

  try {
    await handleUpdate(update);
  } catch (cause) {
    // Отвечаем 200 в любом случае: на ошибку Telegram присылает то же
    // обновление снова и снова, и один сбойный ввод превращается в поток
    // повторов. Разбираться — по логам функции в Vercel.
    console.error("[telegram] необработанный сбой:", cause);
  }

  return new Response("ok");
}

/** Чтобы адрес вебхука можно было проверить в браузере: 404 — значит не задеплоен. */
export function GET() {
  return new Response("Telegram webhook is live. Updates are accepted via POST.", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
