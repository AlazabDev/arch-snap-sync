import { X, Download, Send, MessageSquare, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { ProjectFile, formatFileSize, formatDuration, formatDate, getRoleLabel, getFileTypeLabel } from '@/data/mockData';
import { Button } from '@/components/ui/button';

interface FileViewerProps {
  file: ProjectFile;
  files: ProjectFile[];
  onClose: () => void;
  onNavigate: (file: ProjectFile) => void;
}

export default function FileViewer({ file, files, onClose, onNavigate }: FileViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [comment, setComment] = useState('');
  const currentIndex = files.findIndex(f => f.id === file.id);

  const goNext = () => {
    if (currentIndex < files.length - 1) onNavigate(files[currentIndex + 1]);
  };
  const goPrev = () => {
    if (currentIndex > 0) onNavigate(files[currentIndex - 1]);
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex">
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors">
        <X className="w-5 h-5 text-foreground" />
      </button>

      {/* Main viewer */}
      <div className="flex-1 flex items-center justify-center relative p-8">
        {/* Nav arrows */}
        {currentIndex > 0 && (
          <button onClick={goPrev} className="absolute right-4 w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        {currentIndex < files.length - 1 && (
          <button onClick={goNext} className="absolute left-4 w-10 h-10 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Content */}
        <div className="max-w-4xl max-h-[80vh] overflow-auto">
          {file.type === 'image' && (
            <div>
              <img
                src={file.url}
                alt={file.name}
                className="rounded-lg transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
              />
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.25))} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-muted transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-sm text-muted-foreground min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-muted transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {file.type === 'video' && (
            <div className="w-full max-w-3xl">
              {file.thumbnail && (
                <div className="relative aspect-video bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center">
                  <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                    <p className="text-background text-sm">مشغل الفيديو • {file.duration ? formatDuration(file.duration) : ''}</p>
                  </div>
                </div>
              )}
            </div>
          )}
          {file.type === 'audio' && (
            <div className="w-80 bg-card rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              <div className="w-20 h-20 mx-auto rounded-full bg-success/15 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-success" />
              </div>
              <p className="font-bold text-foreground mb-1">{file.name}</p>
              <p className="text-muted-foreground text-sm">{file.duration ? formatDuration(file.duration) : 'ملاحظة صوتية'}</p>
              <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-success rounded-full" />
              </div>
            </div>
          )}
          {file.type === 'pdf' && (
            <div className="w-80 bg-card rounded-2xl p-8 text-center" style={{ boxShadow: 'var(--shadow-elevated)' }}>
              <div className="w-20 h-20 mx-auto rounded-full bg-destructive/15 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-destructive rotate-180" />
              </div>
              <p className="font-bold text-foreground mb-1">{file.name}</p>
              <p className="text-muted-foreground text-sm">{file.pages} صفحة • {formatFileSize(file.size)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Side panel */}
      <div className="w-80 bg-card border-r border-border p-6 overflow-y-auto flex flex-col">
        <h3 className="font-bold text-foreground mb-4">تفاصيل الملف</h3>
        
        <div className="space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="text-muted-foreground">النوع</span>
            <span className="text-foreground">{getFileTypeLabel(file.type)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الحجم</span>
            <span className="text-foreground">{formatFileSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">المرسل</span>
            <span className="text-foreground">{file.sender}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الدور</span>
            <span className="text-foreground">{getRoleLabel(file.senderRole)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">التاريخ</span>
            <span className="text-foreground">{formatDate(file.uploadedAt)}</span>
          </div>
          {file.width && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">الأبعاد</span>
              <span className="text-foreground">{file.width} × {file.height}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-6">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5">
            <Download className="w-4 h-4" />
            تحميل
          </Button>
          <Button size="sm" className="flex-1 gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
            <Send className="w-4 h-4" />
            إرسال للدفترة
          </Button>
        </div>

        {/* Comments */}
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            التعليقات ({file.comments.length})
          </h4>
          <div className="space-y-3 mb-4">
            {file.comments.map((c, i) => (
              <div key={i} className="bg-muted rounded-lg p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-foreground">{c.author}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                </div>
                <p className="text-sm text-muted-foreground">{c.text}</p>
              </div>
            ))}
            {file.comments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">لا توجد تعليقات بعد</p>
            )}
          </div>

          {/* Add comment */}
          <div className="mt-auto">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="أضف تعليقاً..."
              className="w-full bg-muted rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
              rows={2}
            />
            <Button size="sm" className="mt-2 w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={!comment.trim()}>
              إرسال التعليق
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
