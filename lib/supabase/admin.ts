import "server-only";
import { createClient } from "@supabase/supabase-js";
import { STORAGE_BUCKET } from "./public";

/* ------------------------------------------------------------------
   Service-role client — bypasses RLS. Only ever imported from Server
   Actions guarded by `requireAdminSession()`; `server-only` makes any
   accidental import from client code a build-time error.
------------------------------------------------------------------ */

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set (check .env.local)`);
  return value;
}

// No generated Database types — rows are mapped manually in
// `lib/content/queries.ts`, so the client is intentionally untyped here.
let cached: any = null;

export function createAdminClient(): any {
  if (!cached) {
    cached = createClient(
      getEnv("NEXT_PUBLIC_SUPABASE_URL"),
      getEnv("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } }
    );
  }
  return cached;
}

export { STORAGE_BUCKET };
