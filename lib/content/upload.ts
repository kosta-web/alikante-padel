"use server";

import { uploadImageBytes } from "@/lib/content/core";
import { requireAdminSession } from "@/lib/admin-auth";

/** Uploads an admin-picked image to Storage and returns its public URL. */
export async function uploadImage(folder: string, file: File): Promise<string> {
  await requireAdminSession();
  return uploadImageBytes(folder, await file.arrayBuffer(), {
    contentType: file.type || undefined,
    ext: file.name.split(".").pop(),
  });
}
