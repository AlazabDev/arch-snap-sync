// src/hooks/useWhatsAppTemplates.ts
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: "marketing" | "utility" | "authentication";
  language: "ar" | "en";
  templateId?: string;
  body: string;
  variables: string[];
  headerType?: "text" | "image" | "document" | "video";
  headerContent?: string;
  footerText?: string;
  buttons?: Array<{
    type: "url" | "call" | "reply";
    text: string;
    value?: string;
  }>;
  status: "pending_review" | "approved" | "rejected" | "disabled";
  createdAt: Date;
  updatedAt: Date;
}

export const useWhatsAppTemplates = () => {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب القوالب
  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (supabaseError) throw supabaseError;

      setTemplates(data || []);
      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل جلب القوالب";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // إنشاء قالب جديد
  const createTemplate = useCallback(async (template: Omit<WhatsAppTemplate, "id" | "createdAt" | "updatedAt">) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("whatsapp_templates")
        .insert([
          {
            ...template,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ])
        .select();

      if (supabaseError) throw supabaseError;

      // إرسال القالب إلى Meta للمراجعة
      await submitTemplateToMeta(data[0]);

      return { success: true, data: data[0] };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل إنشاء القالب";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // تحديث القالب
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<WhatsAppTemplate>) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: supabaseError } = await supabase
          .from("whatsapp_templates")
          .update({
            ...updates,
            updated_at: new Date(),
          })
          .eq("id", id)
          .select();

        if (supabaseError) throw supabaseError;

        return { success: true, data: data[0] };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل تحديث القالب";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // حذف القالب
  const deleteTemplate = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: supabaseError } = await supabase
        .from("whatsapp_templates")
        .delete()
        .eq("id", id);

      if (supabaseError) throw supabaseError;

      return { success: true };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل حذف القالب";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // إرسال رسالة باستخدام قالب
  const sendTemplateMessage = useCallback(
    async (templateId: string, phoneNumber: string, variables: Record<string, string> = {}) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/whatsapp/send-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId,
            phoneNumber,
            variables,
          }),
        });

        if (!response.ok) throw new Error("فشل إرسال الرسالة");

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "خطأ في الإرسال";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    templates,
    isLoading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    sendTemplateMessage,
  };
};

// إرسال القالب إلى Meta
async function submitTemplateToMeta(template: WhatsAppTemplate) {
  try {
    await fetch("/api/whatsapp/submit-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: template.name,
        category: template.category,
        language: template.language,
        body: template.body,
        header_type: template.headerType,
        header_content: template.headerContent,
        footer_text: template.footerText,
        buttons: template.buttons,
      }),
    });
  } catch (error) {
    console.error("Error submitting template to Meta:", error);
  }
}
