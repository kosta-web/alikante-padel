-- TOP PADEL ALICANTE — состояние диалога с Telegram-ботом.
-- Выполнить один раз в Supabase SQL Editor. Безопасно запускать повторно.

-- ---------------------------------------------------------------------------
-- telegram_sessions — на чём остановился разговор с каждым админом.
-- Вебхук на Vercel живёт один запрос, между сообщениями в памяти ничего не
-- сохраняется — поэтому «какой раздел открыт», «какая запись выбрана» и
-- «какое поле сейчас вводится» лежат здесь.
-- ---------------------------------------------------------------------------
create table if not exists public.telegram_sessions (
  chat_id bigint primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- RLS включён и политик нет намеренно: таблица служебная, читать и писать её
-- должен только service_role (он RLS обходит). Для anon это значит «пусто и
-- недоступно» — как и задумано.
alter table public.telegram_sessions enable row level security;

revoke all on public.telegram_sessions from anon, authenticated;
grant all on public.telegram_sessions to service_role;
