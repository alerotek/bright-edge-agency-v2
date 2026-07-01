/**
 * V2 Image Storage
 * --------------------------------------------------------------
 * Decision 1 = (B): keep Supabase Storage for V2 launch, migrate
 * to Cloudflare R2 in Phase 6. This module is the storage
 * abstraction so the rest of the app does not need to change.
 *
 * The public bucket URL is set via `VITE_STORAGE_BASE_URL`. If it
 * is empty we fall back to Supabase Storage public URLs.
 */

import { supabase } from "@/integrations/supabase/client";
import { env } from "@/lib/env";

export type UploadInput = {
  bucket: string;
  path: string;               // e.g. "properties/{propertyId}/{filename}"
  file: File | Blob;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
};

export type UploadResult = {
  path: string;
  publicUrl: string;
  provider: "supabase" | "r2";
};

function resolveProvider(): "supabase" | "r2" {
  return env.storageBaseUrl() ? "r2" : "supabase";
}

function publicUrlFor(path: string, bucket: string): string {
  if (resolveProvider() === "r2") {
    return `${env.storageBaseUrl().replace(/\/$/, "")}/${bucket}/${path}`;
  }
  // Supabase public URL
  return `${env.supabaseUrl()}/storage/v1/object/public/${bucket}/${path}`;
}

/**
 * Upload a file. Returns the canonical public URL.
 */
export async function uploadFile(input: UploadInput): Promise<UploadResult> {
  if (resolveProvider() === "r2") {
    // Phase 6: implement R2 presigned upload via /api/storage/sign
    throw new Error("R2 uploads are not wired yet — Phase 6 will add the signed-upload route.");
  }

  const { bucket, path, file, contentType, cacheControl = "3600", upsert = false } = input;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: contentType ?? (file as any).type ?? "application/octet-stream",
    cacheControl,
    upsert,
  });
  if (error) throw error;
  return { path, publicUrl: publicUrlFor(path, bucket), provider: "supabase" };
}

/**
 * Build the public URL for a known object path.
 * Pure helper — no network call.
 */
export function getPublicUrl(bucket: string, path: string): string {
  return publicUrlFor(path, bucket);
}

/**
 * Delete a file.
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  if (resolveProvider() === "r2") {
    throw new Error("R2 deletes are not wired yet — Phase 6 will add the signed-delete route.");
  }
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}

/**
 * List files in a path prefix.
 */
export async function listFiles(bucket: string, prefix: string) {
  if (resolveProvider() === "r2") {
    throw new Error("R2 listing is not wired yet.");
  }
  const { data, error } = await supabase.storage.from(bucket).list(prefix);
  if (error) throw error;
  return data ?? [];
}
