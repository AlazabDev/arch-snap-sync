import { Camera, Video, Mic, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, getStatusLabel, getStatusClass, formatFileSize } from '@/data/mockData';
import type { Project } from '@/hooks/useProjects';

export default function ProjectCard({ project }: { project: Project }) {
  const fc = project.files_count || { images: 0, videos: 0, audio: 0, pdf: 0 };
  const total = fc.images + fc.videos + fc.audio + fc.pdf;

  return (
    <Link to={`/project/${project.id}`} className="project-card block animate-fade-in">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-muted">
        {project.thumbnail_url ? (
          <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className={`badge-status ${getStatusClass(project.status as any)}`}>
            {getStatusLabel(project.status as any)}
          </span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-2 right-3 text-xs text-white/80 font-medium">{project.project_number}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground mb-1 truncate">{project.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 truncate">{project.client_name || '—'}</p>

        {/* File counts */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{fc.images}</span>
          <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" />{fc.videos}</span>
          <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" />{fc.audio}</span>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{fc.pdf}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(project.updated_at)}</span>
          <span>{total} ملف • {formatFileSize(project.total_size || 0)}</span>
        </div>
      </div>
    </Link>
  );
}
