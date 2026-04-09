// src/pages/WhatsAppIntegration.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { MessageCircle, Send, AlertCircle } from "lucide-react";

export default function WhatsAppIntegration() {
  const { isLoading, error, messages, sendWhatsAppMessage, fetchMessages } =
    useWhatsApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  const handleSendMessage = async () => {
    if (!phoneNumber || !message) return;

    const result = await sendWhatsAppMessage(phoneNumber, message);
    if (result.success) {
      setMessage("");
      setPhoneNumber("");
      fetchMessages();
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MessageCircle className="w-6 h-6 text-green-500" />
        <h1 className="text-3xl font-bold">تكامل WhatsApp</h1>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Send Message Card */}
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">إرسال رسالة</h2>

        <div>
          <label className="block text-sm font-medium mb-2">
            رقم الهاتف (مثال: 201001234567)
          </label>
          <Input
            type="text"
            placeholder="+201001234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الرسالة</label>
          <textarea
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            rows={4}
            placeholder="اكتب رسالتك هنا..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleSendMessage}
          disabled={isLoading || !phoneNumber || !message}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <Send className="w-4 h-4 ml-2" />
          {isLoading ? "جاري الإرسال..." : "إرسال الرسالة"}
        </Button>
      </Card>

      {/* Messages List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">الرسائل</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد رسائل</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">
                      {msg.from || "أنت"}
                    </p>
                    <p className="text-gray-700 mt-1">{msg.message}</p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {msg.timestamp}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                    {msg.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
