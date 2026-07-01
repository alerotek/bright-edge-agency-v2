/**
 * V2 Agent Onboarding — Document upload helpers
 * --------------------------------------------------------------
 * Decision 1 = Supabase Storage for now, R2 later.
 * Uploads go to bucket "agent-documents" under:
 *   agents/{agentId}/{kind}/{timestamp}-{filename}
 *
 * This module wraps `lib/storage.ts` and adds the V2-specific
 * path conventions and metadata extraction.
 */

import { uploadFile, type UploadResult } from "@/lib/storage";

export type AgentDocumentKind =
  | "national_id_front"
  | "national_id_back"
  | "selfie"
  | "profile_photo";

const BUCKET = "agent-documents";

/**
 * Upload a single agent document. Returns the canonical public URL
 * and the storage path, both of which should be stored on
 * `agent_documents`.
 */
export async function uploadAgentDocument(args: {
  agentId: string;
  kind: AgentDocumentKind;
  file: File;
}): Promise<UploadResult> {
  const safeName = args.file.name
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 80);
  const path = `agents/${args.agentId}/${args.kind}/${Date.now()}-${safeName}`;
  return uploadFile({
    bucket: BUCKET,
    path,
    file: args.file,
    contentType: args.file.type,
    cacheControl: "31536000", // 1 year, immutable
  });
}

/**
 * Image-only upload helper with simple validation:
 *   - must be image/* or jpg/png/webp/heic
 *   - max 8 MB
 *   - returns dimensions when the file is a real image
 */
export async function uploadAgentImage(args: {
  agentId: string;
  kind: AgentDocumentKind;
  file: File;
}): Promise<UploadResult & { width?: number; height?: number }> {
  const allowed = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]);
  if (!allowed.has(args.file.type)) {
    throw new Error(`Unsupported image type: ${args.file.type || "unknown"}`);
  }
  if (args.file.size > 8 * 1024 * 1024) {
    throw new Error("Image must be 8 MB or smaller.");
  }
  const result = await uploadAgentDocument(args);

  // Try to extract dimensions (best effort; non-fatal on failure).
  let width: number | undefined;
  let height: number | undefined;
  try {
    const dims = await readImageDimensions(args.file);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  } catch {
    // ignore — image still uploads
  }
  return { ...result, width, height };
}

async function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
