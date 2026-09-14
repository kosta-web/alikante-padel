import { createClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------
   Anonymous/publishable client — public read access only (RLS limits
   writes and, for `articles`, limits reads to published rows). Safe to
   use from Server Components; never used for admin writes.
------------------------------------------------------------------ */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (check .env.local)`);
  return value;
}

// No generated Database types — rows are mapped manually in
// `lib/content/queries.ts`, so the client is intentionally untyped here.
let cached: any = null;

export function createPublicClient(): any {
  if (!cached) {
    cached = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
      { auth: { persistSession: false } }
    );
  }
  return cached;
}

export const STORAGE_BUCKET = "site-media";

/** Resolves a stored Storage path (e.g. `cards/abc.webp`) to a public URL. */
export function publicImageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Root-relative path — a placeholder shipped in `public/`, not a Storage
  // object. Seeded content starts out pointing at these; uploading a real
  // image in /admin replaces the value with a Storage key.
  if (path.startsWith("/")) return path;
  const { data } = createPublicClient().storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
