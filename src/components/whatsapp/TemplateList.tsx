// src/components/whatsapp/TemplateList.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useWhatsAppTemplates, WhatsAppTemplate } from "@/hooks/useWhatsAppTemplates";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Send } from "lucide-react";

interface TemplateListProps {
  onSelectTemplate?: (template: WhatsAppTemplate) => void;
}

export default function TemplateList({ onSelectTemplate }: TemplateListProps) {
  const { templates, fetchTemplates, deleteTemplate, isLoading } = useWhatsAppTemplates();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const statusColors: Record<string, string> = {
    approved: "bg-green-100 text-green-800",
    pending_review: "bg-yellow-100 text-yellow-800",
    rejected: "bg-red-100 text-red-800",
    disabled: "bg-gray-100 text-gray-800",
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">قوالب الرسائل</h2>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">لا توجد قوالب حتى الآن</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`p-4 cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? "ring-2 ring-green-500"
                  : "hover:shadow-lg"
              }`}
              onClick={() => {
                setSelectedTemplate(template.id);
                onSelectTemplate?.(template);
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{template.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{template.body.substring(0, 100)}...</p>
                </div>
                <Badge className={statusColors[template.status]}>
                  {template.status === "approved" && "موافق عليه"}
                  {template.status === "pending_review" && "قيد المراجعة"}
                  {template.status === "rejected" && "مرفوض"}
                  {template.status === "disabled" && "معطل"}
                </Badge>
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <Badge variant="outline">{template.category}</Badge>
                <Badge variant="outline">{template.language === "ar" ? "العربية" : "English"}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(template.body);
                  }}
                >
                  <Copy className="w-4 h-4 ml-2" />
                  نسخ
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTemplate(template.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  حذف
                </Button>

                {template.status === "approved" && (
                  <Button
                    size="sm"
                    className="bg-green-500 hover:bg-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open send dialog
                    }}
                  >
                    <Send className="w-4 h-4 ml-2" />
                    إرسال
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
