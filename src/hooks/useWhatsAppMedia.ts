// src/hooks/useWhatsAppMedia.ts
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface MediaUpload {
  file: File;
  type: "image" | "document" | "video" | "audio";
  caption?: string;
}

export interface WhatsAppMedia {
  id: string;
  mediaId: string;
  type: "image" | "document" | "video" | "audio";
  url: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export const useWhatsAppMedia = () => {
  const [media, setMedia] = useState<WhatsAppMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // جلب الملفات والصور
  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("whatsapp_media")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setMedia(data || []);
      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل جلب الملفات";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // رفع ملف أو صورة
  const uploadMedia = useCallback(async (upload: MediaUpload) => {
    setIsLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // التحقق من حجم الملف
      const maxSizes: Record<string, number> = {
        image: 5 * 1024 * 1024, // 5MB
        document: 100 * 1024 * 1024, // 100MB
        video: 16 * 1024 * 1024, // 16MB
        audio: 16 * 1024 * 1024, // 16MB
      };

      if (upload.file.size > maxSizes[upload.type]) {
        throw new Error(`حجم الملف أكبر من المسموح به`);
      }

      // رفع الملف إلى Supabase Storage
      const fileName = `${Date.now()}-${upload.file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("whatsapp-media")
        .upload(`${upload.type}s/${fileName}`, upload.file, {
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (storageError) throw storageError;

      // الحصول على رابط الملف العام
      const { data: publicUrlData } = supabase.storage
        .from("whatsapp-media")
        .getPublicUrl(`${upload.type}s/${fileName}`);

      // رفع الملف إلى WhatsApp Media Manager
      const whatsappMediaId = await uploadToWhatsAppMediaManager(
        upload.file,
        upload.type
      );

      // حفظ في قاعدة البيانات
      const { data, error: dbError } = await supabase
        .from("whatsapp_media")
        .insert([
          {
            media_id: whatsappMediaId,
            type: upload.type,
            url: publicUrlData.publicUrl,
            mime_type: upload.file.type,
            size: upload.file.size,
            caption: upload.caption,
            uploaded_at: new Date(),
          },
        ])
        .select();

      if (dbError) throw dbError;

      setUploadProgress(100);
      return { success: true, data: data[0] };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل رفع الملف";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, []);

  // حذف الملف
  const deleteMedia = useCallback(async (id: string, mediaId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // حذف من قاعدة البيانات
      const { error: dbError } = await supabase
        .from("whatsapp_media")
        .delete()
        .eq("id", id);

      if (dbError) throw dbError;

      // حذف من WhatsApp Media Manager
      await deleteFromWhatsAppMediaManager(mediaId);

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل حذف الملف";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    media,
    isLoading,
    error,
    uploadProgress,
    fetchMedia,
    uploadMedia,
    deleteMedia,
  };
};

// رفع الملف إلى WhatsApp Media Manager
async function uploadToWhatsAppMediaManager(
  file: File,
  type: string
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  const response = await fetch("/api/whatsapp/upload-media", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("فشل رفع الملف إلى WhatsApp");

  const data = await response.json();
  return data.mediaId;
}

// حذف الملف من WhatsApp Media Manager
async function deleteFromWhatsAppMediaManager(mediaId: string) {
  const response = await fetch(`/api/whatsapp/media/${mediaId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("فشل حذف الملف من WhatsApp");
}
