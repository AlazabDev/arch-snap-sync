// src/components/whatsapp/TemplateForm.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWhatsAppTemplates, WhatsAppTemplate } from "@/hooks/useWhatsAppTemplates";
import { Plus, X } from "lucide-react";

export default function TemplateForm() {
  const { createTemplate, isLoading } = useWhatsAppTemplates();
  const [formData, setFormData] = useState({
    name: "",
    category: "utility" as const,
    language: "ar" as const,
    body: "",
    headerType: "" as "text" | "image" | "document" | "video" | "",
    headerContent: "",
    footerText: "",
    buttons: [] as Array<{
      type: "url" | "call" | "reply";
      text: string;
      value?: string;
    }>,
  });

  const [newButton, setNewButton] = useState({
    type: "reply" as const,
    text: "",
    value: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const templateData = {
      ...formData,
      headerType: formData.headerType || undefined,
    };

    const result = await createTemplate(templateData as any);
    if (result.success) {
      setFormData({
        name: "",
        category: "utility",
        language: "ar",
        body: "",
        headerType: "",
        headerContent: "",
        footerText: "",
        buttons: [],
      });
    }
  };

  const addButton = () => {
    if (newButton.text) {
      setFormData({
        ...formData,
        buttons: [...formData.buttons, newButton],
      });
      setNewButton({ type: "reply", text: "", value: "" });
    }
  };

  const removeButton = (index: number) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== index),
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">إنشاء قالب رسالة</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* المعلومات الأساسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">اسم القالب</label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="مثال: تأكيد الطلب"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الفئة</label>
            <Select
              value={formData.category}
              onValueChange={(value: any) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marketing">التسويق</SelectItem>
                <SelectItem value="utility">المساعدة</SelectItem>
                <SelectItem value="authentication">المصادقة</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* المحتوى */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">المحتوى</TabsTrigger>
            <TabsTrigger value="header">الرأس</TabsTrigger>
            <TabsTrigger value="buttons">الأزرار</TabsTrigger>
          </TabsList>

          {/* تبويب المحتوى */}
          <TabsContent value="content" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نص الرسالة</label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={5}
                placeholder="استخدم {{1}}, {{2}}, إلخ للمتغيرات"
                required
              />
              <p className="text-xs text-gray-500 mt-2">
                {"مثال: مرحباً {{1}}، طلبك برقم {{2}} تم تأكيده ✅"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">التذييل</label>
              <Input
                value={formData.footerText}
                onChange={(e) =>
                  setFormData({ ...formData, footerText: e.target.value })
                }
                placeholder="شركة العزب للمقاولات"
              />
            </div>
          </TabsContent>

          {/* تبويب الرأس */}
          <TabsContent value="header" className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">نوع الرأس</label>
              <Select
                value={formData.headerType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, headerType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر نوعاً" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون رأس</SelectItem>
                  <SelectItem value="text">نص</SelectItem>
                  <SelectItem value="image">صورة</SelectItem>
                  <SelectItem value="video">فيديو</SelectItem>
                  <SelectItem value="document">مستند</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.headerType && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  محتوى الرأس
                </label>
                <Input
                  value={formData.headerContent}
                  onChange={(e) =>
                    setFormData({ ...formData, headerContent: e.target.value })
                  }
                  placeholder={`أدخل ${formData.headerType === "text" ? "النص" : "رابط الملف"}`}
                />
              </div>
            )}
          </TabsContent>

          {/* تبويب الأزرار */}
          <TabsContent value="buttons" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  نوع الزر
                </label>
                <Select
                  value={newButton.type}
                  onValueChange={(value: any) =>
                    setNewButton({ ...newButton, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reply">الرد</SelectItem>
                    <SelectItem value="url">رابط</SelectItem>
                    <SelectItem value="call">اتصال</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  نص الزر
                </label>
                <Input
                  value={newButton.text}
                  onChange={(e) =>
                    setNewButton({ ...newButton, text: e.target.value })
                  }
                  placeholder="مثال: تأكيد"
                />
              </div>
            </div>

            {((newButton.type as string) === "url" || (newButton.type as string) === "call") && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  {(newButton.type as string) === "url" ? "الرابط" : "رقم الهاتف"}
                </label>
                <Input
                  value={newButton.value}
                  onChange={(e) =>
                    setNewButton({ ...newButton, value: e.target.value })
                  }
                  placeholder={
                    (newButton.type as string) === "url"
                      ? "https://example.com"
                      : "+201001234567"
                  }
                />
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={addButton}
              className="w-full"
            >
              <Plus className="w-4 h-4 ml-2" />
              إضافة زر
            </Button>

            {/* قائمة الأزرار */}
            <div className="space-y-2">
              {formData.buttons.map((btn, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{btn.text}</p>
                    <p className="text-xs text-gray-500">{btn.type}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeButton(idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          type="submit"
          disabled={isLoading || !formData.name || !formData.body}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          {isLoading ? "جاري الإنشاء..." : "إنشاء القالب"}
        </Button>
      </form>
    </Card>
  );
}
