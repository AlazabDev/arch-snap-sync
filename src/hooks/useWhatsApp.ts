// src/hooks/useWhatsApp.ts
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";

interface WhatsAppConfig {
  businessAccountId: string;
  phoneNumberId: string;
  accessToken: string;
}

interface WhatsAppMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read" | "failed";
}

export const useWhatsApp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  // ربط حساب WhatsApp Business
  const linkWhatsAppAccount = useCallback(
    async (config: WhatsAppConfig) => {
      setIsLoading(true);
      setError(null);

      try {
        // حفظ البيانات في Supabase
        const { data, error: supabaseError } = await supabase
          .from("whatsapp_integrations")
          .insert([
            {
              business_account_id: config.businessAccountId,
              phone_number_id: config.phoneNumberId,
              access_token: config.accessToken,
              created_at: new Date(),
              status: "active",
            },
          ])
          .select();

        if (supabaseError) throw supabaseError;

        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل ربط حساب WhatsApp";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // إرسال رسالة WhatsApp
  const sendWhatsAppMessage = useCallback(
    async (phoneNumber: string, message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/whatsapp/send-message", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            message,
          }),
        });

        if (!response.ok) {
          throw new Error("فشل إرسال الرسالة");
        }

        const data = await response.json();
        return { success: true, data };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "خطأ في إرسال الرسالة";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // جلب الرسائل
  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50);

      if (supabaseError) throw supabaseError;

      setMessages(data || []);
      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل جلب الرسائل";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    messages,
    linkWhatsAppAccount,
    sendWhatsAppMessage,
    fetchMessages,
  };
};
