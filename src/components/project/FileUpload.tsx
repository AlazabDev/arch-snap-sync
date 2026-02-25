import { useState, useRef } from 'react';
import { Upload, X, Plus, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  projectId: string;
  onClose: () => void;
}

export default function FileUpload({ projectId, onClose }: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getFileType = (mime: string): string => {
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'pdf';
  };

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles(prev => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length || !user) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const storagePath = `${projectId}/${Date.now()}_${file.name}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('project-files')
          .upload(storagePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('project-files')
          .getPublicUrl(storagePath);

        // Insert file record
        const { error: dbError } = await supabase.from('project_files').insert({
          project_id: projectId,
          file_name: file.name,
          file_type: getFileType(file.type),
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          storage_path: storagePath,
          sender_name: user.user_metadata?.full_name || 'مستخدم',
        });

        if (dbError) throw dbError;

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      toast({ title: 'تم رفع الملفات بنجاح', description: `تم رفع ${files.length} ملف` });
      queryClient.invalidateQueries({ queryKey: ['project-files'] });
      queryClient.invalidateQueries({ queryKey: ['all-files'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    } catch (error: any) {
      toast({ title: 'خطأ في الرفع', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg" style={{ boxShadow: 'var(--shadow-elevated)' }}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">رفع ملفات</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-colors"
          >
            <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">اضغط لاختيار الملفات</p>
            <p className="text-xs text-muted-foreground mt-1">صور، فيديو، صوتيات، PDF</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,audio/*,.pdf"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          {/* File list */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 bg-muted rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} ميجا</p>
                  </div>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1 text-center">{progress}%</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-border">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors">
            إلغاء
          </button>
          <button
            onClick={handleUpload}
            disabled={!files.length || uploading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {uploading ? 'جارٍ الرفع...' : `رفع ${files.length} ملف`}
          </button>
        </div>
      </div>
    </div>
  );
}
