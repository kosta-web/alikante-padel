import "server-only";

/* ------------------------------------------------------------------
   Разбор и показ значений, которые приходят из чата текстом.

   Время клуба — Europe/Madrid, а функция на Vercel живёт в UTC. Если
   разбирать «20.09.2026 18:30» через `new Date(...)`, игра уедет на
   два часа. Поэтому и разбор, и показ идут с явной зоной клуба.
------------------------------------------------------------------ */

export const CLUB_TZ = "Europe/Madrid";

function zoneOffsetMs(instant: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  );
  return asUtc - instant.getTime();
}

/** Собирает момент времени из «стенных» часов клуба, с поправкой на лето/зиму. */
function clubTimeToUtc(y: number, mo: number, d: number, h: number, mi: number): Date {
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  // Два прохода: первый даёт приблизительное смещение, второй — точное для
  // случаев у самой границы перевода часов.
  let utc = naive;
  for (let i = 0; i < 2; i += 1) utc = naive - zoneOffsetMs(new Date(utc), CLUB_TZ);
  return new Date(utc);
}

const DATE_RE = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/;
const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})[ ,]+(\d{1,2}):(\d{2})$/;

/** «20.09.2026» или «2026-09-20» → `yyyy-mm-dd` (колонка типа date). */
export function parseDate(input: string): string {
  const iso = ISO_DATE_RE.exec(input.trim());
  if (iso) return input.trim();
  const m = DATE_RE.exec(input.trim());
  if (!m) throw new Error("Дата нужна в виде 20.09.2026");
  const [, d, mo, y] = m;
  const day = Number(d);
  const month = Number(mo);
  if (month < 1 || month > 12 || day < 1 || day > 31) throw new Error("Такой даты не бывает");
  return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** «20.09.2026 18:30» по времени клуба → ISO-момент для timestamptz. */
export function parseDateTime(input: string): string {
  const raw = input.trim();
  const m = DATETIME_RE.exec(raw);
  if (!m) {
    const asIso = new Date(raw);
    if (!Number.isNaN(asIso.getTime()) && /\d{4}-\d{2}-\d{2}T/.test(raw)) return asIso.toISOString();
    throw new Error("Дата и время нужны в виде 20.09.2026 18:30");
  }
  const [, d, mo, y, h, mi] = m;
  const month = Number(mo);
  const hour = Number(h);
  const minute = Number(mi);
  if (month < 1 || month > 12 || hour > 23 || minute > 59) {
    throw new Error("Такого времени не бывает");
  }
  return clubTimeToUtc(Number(y), month, Number(d), hour, minute).toISOString();
}

export function showDate(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: CLUB_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function showDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: CLUB_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function parseNumber(input: string): number {
  const value = Number(input.trim().replace(",", ".").replace(/\s/g, ""));
  if (!Number.isFinite(value)) throw new Error("Нужно число, например 45 или 12.50");
  return value;
}

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "",
  э: "e", ю: "yu", я: "ya",
};

/** Заголовок статьи → латинский slug для URL. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || `article-${Date.now()}`;
}

/** Обрезает строку до длины, на которой она ещё влезает в кнопку Telegram. */
export function clip(value: string, max = 40): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}
