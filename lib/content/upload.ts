"use server";

import { createAdminClient, STORAGE_BUCKET } from "@/lib/supabase/admin";
import { publicImageUrl } from "@/lib/supabase/public";
import { requireAdminSession } from "@/lib/admin-auth";

/** Uploads an admin-picked image to Storage and returns its public URL. */
export async function uploadImage(folder: string, file: File): Promise<string> {
  await requireAdminSession();

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await createAdminClient()
    .storage.from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined });
  if (error) throw error;

  const url = publicImageUrl(path);
  if (!url) throw new Error("Could not resolve uploaded image URL");
  return url;
}
