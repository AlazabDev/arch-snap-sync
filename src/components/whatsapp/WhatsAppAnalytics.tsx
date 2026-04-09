// src/components/whatsapp/WhatsAppAnalytics.tsx
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MessageCircle, Send, CheckCircle, AlertCircle } from "lucide-react";

interface Stats {
  totalMessages: number;
  sentMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  dailyData: Array<{ date: string; count: number }>;
  statusData: Array<{ name: string; value: number }>;
}

export default function WhatsAppAnalytics() {
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    sentMessages: 0,
    deliveredMessages: 0,
    failedMessages: 0,
    dailyData: [],
    statusData: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // الرسائل الكلية
        const { count: totalMessages } = await supabase
          .from("whatsapp_messages")
          .select("*", { count: "exact", head: true });

        // حسب الحالة
        const { data: statusData } = await supabase.rpc(
          "get_message_status_counts"
        );

        // البيانات اليومية
        const { data: dailyData } = await supabase.rpc(
          "get_daily_message_counts",
          { days: 7 }
        );

        setStats({
          totalMessages: totalMessages || 0,
          sentMessages: statusData?.[0]?.sent || 0,
          deliveredMessages: statusData?.[0]?.delivered || 0,
          failedMessages: statusData?.[0]?.failed || 0,
          dailyData: dailyData || [],
          statusData: [
            { name: "مرسل", value: statusData?.[0]?.sent || 0 },
            { name: "تم التسليم", value: statusData?.[0]?.delivered || 0 },
            { name: "تم القراءة", value: statusData?.[0]?.read || 0 },
            { name: "فشل", value: statusData?.[0]?.failed || 0 },
          ],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* البطاقات الإحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">إجمالي الرسائل</p>
              <p className="text-3xl font-bold text-blue-600">
                {stats.totalMessages}
              </p>
            </div>
            <MessageCircle className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">مرسلة</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.sentMessages}
              </p>
            </div>
            <Send className="w-10 h-10 text-green-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">تم التسليم</p>
              <p className="text-3xl font-bold text-purple-600">
                {stats.deliveredMessages}
              </p>
            </div>
            <CheckCircle className="w-10 h-10 text-purple-400 opacity-50" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">فشل</p>
              <p className="text-3xl font-bold text-red-600">
                {stats.failedMessages}
              </p>
            </div>
            <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
          </div>
        </Card>
      </div>

      {/* الرسوم البيانية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسائل اليومية */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">الرسائل اليومية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* حالة الرسائل */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">حالة الرسائل</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
