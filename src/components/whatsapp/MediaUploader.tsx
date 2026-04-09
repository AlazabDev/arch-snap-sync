// src/components/whatsapp/MediaUploader.tsx
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useWhatsAppMedia } from "@/hooks/useWhatsAppMedia";
import { Upload, Image, File, Play, Music, Trash2 } from "lucide-react";

export default function MediaUploader() {
  const { media, uploadMedia, deleteMedia, uploadProgress, fetchMedia, isLoading } =
    useWhatsAppMedia();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = async (files: FileList) => {
    for (let file of files) {
      const type = getFileType(file);
      if (type) {
        await uploadMedia({ file, type });
      }
    }
    fetchMedia();
  };

  const getFileType = (file: File): "image" | "document" | "video" | "audio" | null => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
    if (
      file.type === "application/pdf" ||
      file.type.includes("document") ||
      file.type.includes("word") ||
      file.type.includes("spreadsheet")
    ) {
      return "document";
    }
    return null;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-6 h-6" />;
      case "video":
        return <Play className="w-6 h-6" />;
      case "audio":
        return <Music className="w-6 h-6" />;
      case "document":
        return <File className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* منطقة الرفع */}
      <Card
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
          }
        }}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          dragActive ? "border-green-500 bg-green-50" : "border-gray-300"
        }`}
      >
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg font-semibold mb-2">اسحب الملفات هنا</p>
        <p className="text-sm text-gray-600 mb-4">أو انقر للاختيار من جهازك</p>

        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
          id="file-upload"
        />

        <Button onClick={() => document.getElementById("file-upload")?.click()}>
          <Upload className="w-4 h-4 ml-2" />
          اختر الملفات
        </Button>

        <p className="text-xs text-gray-500 mt-4">
          الحد الأقصى: الصور 5MB، الفيديو 16MB، المستندات 100MB
        </p>
      </Card>

      {/* شريط التقدم */}
      {isLoading && uploadProgress > 0 && uploadProgress < 100 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">جاري الرفع...</p>
          <Progress value={uploadProgress} />
          <p className="text-xs text-gray-500">{Math.round(uploadProgress)}%</p>
        </div>
      )}

      {/* قائمة الملفات */}
      {media.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold">الملفات المرفوعة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {media.map((file) => (
              <Card key={file.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="text-gray-400">
                    {getIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.url.split("/").pop()}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(file.uploadedAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMedia(file.id, file.mediaId)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
