import { Camera, Video, Mic, FileText, Play } from 'lucide-react';
import { ProjectFile, formatFileSize, formatDuration, formatDate } from '@/data/mockData';

interface MediaGridProps {
  files: ProjectFile[];
  onFileClick: (file: ProjectFile) => void;
  viewMode: 'grid' | 'list';
}

const typeIcons = { image: Camera, video: Video, audio: Mic, pdf: FileText };
const typeColors = {
  image: 'bg-accent/15 text-accent',
  video: 'bg-info/15 text-info',
  audio: 'bg-success/15 text-success',
  pdf: 'bg-destructive/15 text-destructive',
};

export default function MediaGrid({ files, onFileClick, viewMode }: MediaGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-card rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-right py-3 px-4 font-medium">الملف</th>
              <th className="text-right py-3 px-4 font-medium">النوع</th>
              <th className="text-right py-3 px-4 font-medium">الحجم</th>
              <th className="text-right py-3 px-4 font-medium">المرسل</th>
              <th className="text-right py-3 px-4 font-medium">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {files.map((file) => {
              const Icon = typeIcons[file.type];
              return (
                <tr
                  key={file.id}
                  onClick={() => onFileClick(file)}
                  className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${typeColors[file.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-foreground truncate max-w-[200px]">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {file.type === 'image' ? 'صورة' : file.type === 'video' ? 'فيديو' : file.type === 'audio' ? 'صوتي' : 'مستند'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{formatFileSize(file.size)}</td>
                  <td className="py-3 px-4 text-muted-foreground">{file.sender}</td>
                  <td className="py-3 px-4 text-muted-foreground">{formatDate(file.uploadedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className="media-thumb animate-fade-in"
          onClick={() => onFileClick(file)}
        >
          {file.type === 'image' && file.thumbnail && (
            <div className="relative aspect-[4/3]">
              <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover rounded-lg" />
            </div>
          )}
          {file.type === 'video' && (
            <div className="relative aspect-[4/3] bg-muted rounded-lg">
              {file.thumbnail ? (
                <img src={file.thumbnail} alt={file.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Video className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-foreground/70 flex items-center justify-center">
                  <Play className="w-4 h-4 text-background mr-[-2px]" />
                </div>
              </div>
              {file.duration && (
                <span className="absolute bottom-2 left-2 text-xs bg-foreground/70 text-background px-1.5 py-0.5 rounded">
                  {formatDuration(file.duration)}
                </span>
              )}
            </div>
          )}
          {file.type === 'audio' && (
            <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${typeColors.audio}`}>
                <Mic className="w-6 h-6" />
              </div>
              {file.duration && <span className="text-sm text-muted-foreground">{formatDuration(file.duration)}</span>}
            </div>
          )}
          {file.type === 'pdf' && (
            <div className="aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${typeColors.pdf}`}>
                <FileText className="w-6 h-6" />
              </div>
              {file.pages && <span className="text-sm text-muted-foreground">{file.pages} صفحة</span>}
            </div>
          )}
          <div className="mt-2 px-1">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.size)} • {formatDate(file.uploadedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
