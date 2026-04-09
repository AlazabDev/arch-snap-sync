// src/components/whatsapp/WhatsAppMessaging.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useWhatsApp } from "@/hooks/useWhatsApp";
import { Send, Phone, MessageCircle } from "lucide-react";

export default function WhatsAppMessaging() {
  const { isLoading, error, messages, sendWhatsAppMessage, fetchMessages } =
    useWhatsApp();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [conversationFilter, setConversationFilter] = useState("all");

  useEffect(() => {
    fetchMessages();
    // تحديث الرسائل كل 5 ثوان
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async () => {
    if (!phoneNumber || !message) return;

    const result = await sendWhatsAppMessage(phoneNumber, message);
    if (result.success) {
      setMessage("");
      fetchMessages();
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (conversationFilter === "all") return true;
    if (conversationFilter === "sent") return msg.to;
    if (conversationFilter === "received") return msg.from;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* نموذج الرسالة */}
      <Card className="p-6 bg-white shadow-sm">
        <h2 className="text-2xl font-bold mb-4">إرسال رسالة</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Phone className="w-4 h-4 inline mr-2" />
              رقم الهاتف
            </label>
            <Input
              type="text"
              placeholder="+201001234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
              className="text-right"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              الرسالة
            </label>
            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={4}
              placeholder="اكتب رسالتك هنا..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {message.length} / 1024 حرف
            </span>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !phoneNumber || !message}
              className="bg-green-500 hover:bg-green-600"
            >
              <Send className="w-4 h-4 ml-2" />
              {isLoading ? "جاري الإرسال..." : "إرسال"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
      </Card>

      {/* سجل الرسائل */}
      <Card className="p-6 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">سجل الرسائل</h2>
          <select
            value={conversationFilter}
            onChange={(e) => setConversationFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">الكل</option>
            <option value="sent">المرسلة</option>
            <option value="received">الواردة</option>
          </select>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <p className="text-center text-gray-500 py-8">لا توجد رسائل</p>
          ) : (
            filteredMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-4 rounded-lg border ${
                  msg.to
                    ? "bg-green-50 border-green-200 ml-8"
                    : "bg-blue-50 border-blue-200 mr-8"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">
                      {msg.to ? "🟢 مرسل إلى: " + msg.to : "🔵 من: " + msg.from}
                    </p>
                    <p className="text-gray-700 mt-2">{msg.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      msg.status === "sent" || msg.status === "delivered"
                        ? "bg-green-200 text-green-800"
                        : msg.status === "read"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-yellow-200 text-yellow-800"
                    }`}
                  >
                    {msg.status === "sent" && "مرسل ✓"}
                    {msg.status === "delivered" && "تم التسليم ✓✓"}
                    {msg.status === "read" && "تم القراءة ✓✓✓"}
                    {msg.status === "failed" && "فشل ✗"}
                  </span>

                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleString("ar-EG")}
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
