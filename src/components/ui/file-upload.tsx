"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface FileUploadProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucket?: string;
  folder?: string;
  maxSizeBytes?: number;
  acceptedTypes?: string[];
  label?: string;
  className?: string;
  placeholder?: string;
}

export function FileUpload({
  value,
  onChange,
  bucket = "photos",
  folder = "uploads",
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ["image/jpeg", "image/png", "image/webp"],
  label,
  className,
  placeholder,
}: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const t = useTranslations();

  const generateFileName = (originalName: string): string => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = originalName.split(".").pop();
    return `${timestamp}-${randomString}.${fileExtension}`;
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileName = generateFileName(file.name);
    const filePath = `${folder}/${fileName}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    return publicUrl;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        setError(t("fileUpload.invalidFileType"));
        return;
      }

      // Validate file size
      if (file.size > maxSizeBytes) {
        setError(
          t("fileUpload.fileTooLarge", {
            maxSize: Math.round(maxSizeBytes / 1024 / 1024),
          })
        );
        return;
      }

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      try {
        // Create preview URL
        const preview = URL.createObjectURL(file);
        setPreviewUrl(preview);

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + 10;
          });
        }, 100);

        // Upload file
        const url = await uploadFile(file);

        // Complete progress
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
          onChange(url);
          setPreviewUrl(url);
        }, 500);
      } catch (error) {
        console.error("Upload error:", error);
        setError(
          error instanceof Error ? error.message : t("fileUpload.uploadFailed")
        );
        setIsUploading(false);
        setUploadProgress(0);
        setPreviewUrl(null);
      }
    },
    [acceptedTypes, maxSizeBytes, onChange, t]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles: 1,
    multiple: false,
  });

  const removeFile = () => {
    setPreviewUrl(null);
    onChange(null);
    setError(null);
  };

  const handleUrlChange = (url: string) => {
    setPreviewUrl(url);
    onChange(url);
    setError(null);
  };

  return (
    <div className={className}>
      {label && (
        <Label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </Label>
      )}

      <div className="mt-2 space-y-4">
        {/* URL Input */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-600">
            {t("fileUpload.urlInput")}
          </Label>
          <Input
            type="url"
            value={value || ""}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder || t("fileUpload.urlPlaceholder")}
            className="w-full"
          />
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {t("fileUpload.or")}
            </span>
          </div>
        </div>

        {/* File Upload */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />

          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto h-32 w-32 object-cover rounded-lg"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-sm text-gray-600">
                    {t("fileUpload.uploading")}
                  </p>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    {isDragActive ? (
                      <p>{t("fileUpload.dropFile")}</p>
                    ) : (
                      <p>
                        {t("fileUpload.dragOrClick")} <br />
                        <span className="text-xs text-gray-500">
                          {t("fileUpload.supportedFormats")}
                        </span>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
