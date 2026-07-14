import { supabase } from "@/integrations/supabase/client";

const AGENT_DOCUMENTS_BUCKET = "agent-documents";

export async function uploadAgentDocument(
  file: File,
  agentId: string,
  documentKind: string
): Promise<{ publicUrl: string; path: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${agentId}/${documentKind}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(AGENT_DOCUMENTS_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(AGENT_DOCUMENTS_BUCKET)
    .getPublicUrl(data.path);

  return {
    publicUrl: publicUrlData.publicUrl,
    path: data.path,
  };
}

export async function deleteAgentDocument(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(AGENT_DOCUMENTS_BUCKET)
    .remove([path]);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}

export function validateDocumentFile(file: File, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only JPEG, PNG, and WebP images are allowed" };
  }

  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }

  return { valid: true };
}
