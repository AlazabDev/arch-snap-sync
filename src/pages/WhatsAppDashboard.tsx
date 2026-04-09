// src/pages/WhatsAppDashboard.tsx
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import TemplateForm from "@/components/whatsapp/TemplateForm";
import TemplateList from "@/components/whatsapp/TemplateList";
import MediaUploader from "@/components/whatsapp/MediaUploader";
import WhatsAppMessaging from "@/components/whatsapp/WhatsAppMessaging";
import WhatsAppAnalytics from "@/components/whatsapp/WhatsAppAnalytics";
import {
  MessageSquare,
  Settings,
  BarChart3,
  FileUp,
} from "lucide-react";

export default function WhatsAppDashboard() {
  const [activeTab, setActiveTab] = useState("messages");

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquare className="w-8 h-8 text-green-600" />
          <h1 className="text-4xl font-bold text-gray-900">لوحة تحكم WhatsApp</h1>
        </div>
        <p className="text-gray-600">
          إدارة الرسائل والقوالب والملفات والإحصائيات
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm rounded-lg p-1">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">الرسائل</span>
          </TabsTrigger>

          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">القوالب</span>
          </TabsTrigger>

          <TabsTrigger value="media" className="flex items-center gap-2">
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">الملفات</span>
          </TabsTrigger>

          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">الإحصائيات</span>
          </TabsTrigger>
        </TabsList>

        {/* الرسائل */}
        <TabsContent value="messages" className="mt-6">
          <Card className="p-6">
            <WhatsAppMessaging />
          </Card>
        </TabsContent>

        {/* القوالب */}
        <TabsContent value="templates" className="mt-6 space-y-6">
          <Card className="p-6">
            <TemplateForm />
          </Card>
          <Card className="p-6">
            <TemplateList />
          </Card>
        </TabsContent>

        {/* الملفات */}
        <TabsContent value="media" className="mt-6">
          <Card className="p-6">
            <MediaUploader />
          </Card>
        </TabsContent>

        {/* الإحصائيات */}
        <TabsContent value="analytics" className="mt-6">
          <Card className="p-6">
            <WhatsAppAnalytics />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
