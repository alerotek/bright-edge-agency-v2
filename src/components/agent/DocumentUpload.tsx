import { useState } from "react";
import { Upload, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { validateDocumentFile, uploadAgentDocument } from "@/lib/supabase-storage";
import { toast } from "sonner";

interface DocumentUploadProps {
  label: string;
  kind: string;
  agentId: string;
  onUploadComplete: (publicUrl: string, path: string) => void;
  required?: boolean;
}

export function DocumentUpload({
  label,
  kind,
  agentId,
  onUploadComplete,
  required = true,
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<{ publicUrl: string; path: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadAgentDocument(file, agentId, kind);
      setUploaded(result);
      onUploadComplete(result.publicUrl, result.path);
      toast.success(`${label} uploaded successfully`);
    } catch (err) {
      setError("Failed to upload document. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploaded(null);
    setError(null);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium">
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </p>
            {error && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
          </div>

          {!uploaded ? (
            <div className="flex items-center gap-2">
              <input
                type="file"
                id={`upload-${kind}`}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <label htmlFor={`upload-${kind}`}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                  asChild
                >
                  <span className="cursor-pointer">
                    {uploading ? (
                      "Uploading..."
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-green-600">
                <Check className="h-3 w-3" />
                Uploaded
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
