// src/hooks/useWhatsAppMedia.ts
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface WhatsAppMedia {
  id: string;
  media_id: string;
  mediaId?: string;
  type: string;
  url: string;
  mime_type?: string;
  mimeType?: string;
  size: number;
  uploaded_at?: string;
  caption?: string;
  integration_id?: string;
}

export const useWhatsAppMedia = () => {
  const [media, setMedia] = useState<WhatsAppMedia[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // جلب الملفات
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

  // رفع الملف
  const uploadMedia = useCallback(
    async (
      file: File,
      type: "image" | "document" | "video" | "audio"
    ) => {
      setIsLoading(true);
      setError(null);
      setUploadProgress(0);

      try {
        // التحقق من الحجم
        const maxSizes: Record<string, number> = {
          image: 5 * 1024 * 1024, // 5MB
          document: 100 * 1024 * 1024, // 100MB
          video: 16 * 1024 * 1024, // 16MB
          audio: 16 * 1024 * 1024, // 16MB
        };

        if (file.size > maxSizes[type]) {
          throw new Error(
            `حجم الملف يتجاوز الحد الأقصى (${maxSizes[type] / 1024 / 1024}MB)`
          );
        }

        // رفع الملف إلى Supabase Storage
        const fileName = `${Date.now()}-${file.name}`;
        const { data: storageData, error: storageError } =
          await supabase.storage
            .from("whatsapp-media")
            .upload(`${type}s/${fileName}`, file);

        if (storageError) throw storageError;

        // الحصول على رابط عام
        const { data: publicUrlData } = supabase.storage
          .from("whatsapp-media")
          .getPublicUrl(`${type}s/${fileName}`);

        // رفع إلى WhatsApp عبر Edge Function
        const { data: whatsappData, error: functionError } =
          await supabase.functions.invoke("upload-whatsapp-media", {
            body: {
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              type: type.toUpperCase(),
            },
          });

        if (functionError) throw functionError;

        // حفظ في قاعدة البيانات
        const { data, error: dbError } = await supabase
          .from("whatsapp_media")
          .insert([
            {
              media_id: whatsappData.mediaId,
              type,
              url: publicUrlData.publicUrl,
              mime_type: file.type,
              size: file.size,
              uploaded_at: new Date(),
            },
          ])
          .select();

        if (dbError) throw dbError;

        setUploadProgress(100);
        return { success: true, data: data?.[0] };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل رفع الملف";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
        setUploadProgress(0);
      }
    },
    []
  );

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

      // حذف من WhatsApp
      await supabase.functions.invoke("delete-whatsapp-media", {
        body: { mediaId },
      });

      // تحديث القائمة
      setMedia((prev) => prev.filter((m) => m.id !== id));

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
