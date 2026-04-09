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
  created_at?: Date;
  updated_at?: Date;
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

  // إنشاء قالب
  const createTemplate = useCallback(
    async (template: Omit<WhatsAppTemplate, "id">) => {
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

        // إرسال إلى Meta
        if (data?.[0]) {
          await submitTemplateToMeta(data[0]);
        }

        return { success: true, data: data?.[0] };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل إنشاء القالب";
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

      // تحديث القائمة
      setTemplates((prev) => prev.filter((t) => t.id !== id));

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

  // إرسال رسالة من قالب
  const sendTemplateMessage = useCallback(
    async (
      templateName: string,
      phoneNumber: string,
      variables: Record<string, string> = {}
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          "send-whatsapp-template",
          {
            body: {
              templateName,
              phoneNumber,
              variables,
            },
          }
        );

        if (functionError) throw functionError;

        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل إرسال الرسالة";
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
    deleteTemplate,
    sendTemplateMessage,
  };
};

async function submitTemplateToMeta(template: WhatsAppTemplate) {
  try {
    await supabase.functions.invoke("submit-template-to-meta", {
      body: {
        name: template.name,
        category: template.category,
        language: template.language,
        body: template.body,
        headerType: template.headerType,
        headerContent: template.headerContent,
        footerText: template.footerText,
        buttons: template.buttons,
      },
    });
  } catch (error) {
    console.error("Error submitting template to Meta:", error);
  }
}
