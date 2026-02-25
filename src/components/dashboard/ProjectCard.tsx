import { Camera, Video, Mic, FileText, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project, formatDate, getStatusLabel, getStatusClass, formatFileSize } from '@/data/mockData';

export default function ProjectCard({ project }: { project: Project }) {
  const total = project.filesCount.images + project.filesCount.videos + project.filesCount.audio + project.filesCount.pdf;

  return (
    <Link to={`/project/${project.id}`} className="project-card block animate-fade-in">
      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden">
        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3">
          <span className={`badge-status ${getStatusClass(project.status)}`}>
            {getStatusLabel(project.status)}
          </span>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-2 right-3 text-xs text-white/80 font-medium">{project.number}</p>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-foreground mb-1 truncate">{project.name}</h3>
        <p className="text-sm text-muted-foreground mb-3 truncate">{project.client}</p>

        {/* File counts */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" />{project.filesCount.images}</span>
          <span className="flex items-center gap-1"><Video className="w-3.5 h-3.5" />{project.filesCount.videos}</span>
          <span className="flex items-center gap-1"><Mic className="w-3.5 h-3.5" />{project.filesCount.audio}</span>
          <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />{project.filesCount.pdf}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(project.lastActivity)}</span>
          <span>{total} ملف • {formatFileSize(project.totalSize)}</span>
        </div>
      </div>
    </Link>
  );
}
