// src/hooks/useWhatsApp.ts
import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import axios from "axios";

interface WhatsAppMessage {
  id: string;
  from?: string;
  to?: string;
  message: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read" | "failed";
  type?: string;
  media_url?: string;
}

export const useWhatsApp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);

  // إرسال رسالة نصية
  const sendWhatsAppMessage = useCallback(
    async (phoneNumber: string, message: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // التحقق من صيغة الرقم
        if (!phoneNumber.match(/^\+\d{1,15}$/)) {
          throw new Error("صيغة الرقم غير صحيحة");
        }

        // استدعاء الـ Edge Function من Supabase
        const { data, error: functionError } = await supabase.functions.invoke(
          "send-whatsapp-message",
          {
            body: {
              phoneNumber,
              message,
              type: "text",
            },
          }
        );

        if (functionError) throw functionError;

        // حفظ الرسالة في قاعدة البيانات
        const { data: savedMessage, error: dbError } = await supabase
          .from("whatsapp_messages")
          .insert([
            {
              id: data.messageId,
              to: phoneNumber,
              message,
              status: "sent",
              type: "text",
              timestamp: new Date(),
            },
          ])
          .select();

        if (dbError) throw dbError;

        return { success: true, data: savedMessage?.[0] };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "فشل إرسال الرسالة";
        setError(errorMessage);
        console.error("Error sending message:", err);
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

      setMessages(
        (data || []).map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }))
      );

      return { success: true, data };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "فشل جلب الرسائل";
      setError(errorMessage);
      console.error("Error fetching messages:", err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    messages,
    sendWhatsAppMessage,
    fetchMessages,
  };
};
