import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Camera, Video, Mic, FileText, Search, LayoutGrid, List, MapPin, Calendar, Upload } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import MediaGrid from '@/components/project/MediaGrid';
import FileViewer from '@/components/project/FileViewer';
import FileUpload from '@/components/project/FileUpload';
import { useProject, useProjectFiles } from '@/hooks/useProjects';
import { formatDate, formatFileSize, getStatusLabel, getStatusClass, type FileType } from '@/data/mockData';

const typeFilters: { key: FileType | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'الكل', icon: LayoutGrid },
  { key: 'image', label: 'صور', icon: Camera },
  { key: 'video', label: 'فيديو', icon: Video },
  { key: 'audio', label: 'صوتي', icon: Mic },
  { key: 'pdf', label: 'مستندات', icon: FileText },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: dbFiles = [], isLoading: filesLoading } = useProjectFiles(id);
  const [typeFilter, setTypeFilter] = useState<FileType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showUpload, setShowUpload] = useState(false);

  // Map DB files to the format expected by MediaGrid/FileViewer
  const mappedFiles = useMemo(() => {
    return dbFiles.map(f => ({
      id: f.id,
      name: f.file_name,
      type: f.file_type as FileType,
      size: f.file_size || 0,
      url: f.file_url,
      thumbnail: f.thumbnail_url || (f.file_type === 'image' ? f.file_url : undefined),
      uploadedAt: f.created_at,
      sender: f.sender_name || 'غير معروف',
      senderRole: 'contractor' as const,
      projectId: f.project_id,
      duration: f.duration_seconds || undefined,
      pages: f.page_count || undefined,
      width: f.width || undefined,
      height: f.height || undefined,
      comments: [],
    }));
  }, [dbFiles]);

  const files = useMemo(() => {
    return mappedFiles
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .filter(f => f.name.includes(search) || f.sender.includes(search));
  }, [mappedFiles, typeFilter, search]);

  if (projectLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen text-muted-foreground">جارٍ التحميل...</div>
      </AppLayout>
    );
  }

  if (!project) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen text-muted-foreground">المشروع غير موجود</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">لوحة التحكم</Link>
          <ArrowRight className="w-4 h-4 rotate-180" />
          <span className="text-foreground font-medium">{project.name}</span>
        </div>

        {/* Project Header */}
        <div className="relative rounded-2xl overflow-hidden mb-8" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <div className="h-48 overflow-hidden bg-muted">
            {project.thumbnail_url ? (
              <img src={project.thumbnail_url} alt={project.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <span className={`badge-status ${getStatusClass(project.status as any)}`}>{getStatusLabel(project.status as any)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <span>{project.project_number}</span>
                  {project.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.location}</span>}
                  {project.start_date && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(project.start_date)}</span>}
                </div>
              </div>
              <div className="text-left text-sm">
                <button
                  onClick={() => setShowUpload(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors mb-2"
                >
                  <Upload className="w-4 h-4" />
                  رفع ملفات
                </button>
                {project.client_name && <p className="opacity-80">{project.client_name}</p>}
                <p className="opacity-80">{mappedFiles.length} ملف</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-6 gap-4">
          <div className="flex gap-2">
            {typeFilters.map(tf => (
              <button
                key={tf.key}
                onClick={() => setTypeFilter(tf.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  typeFilter === tf.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={typeFilter !== tf.key ? { boxShadow: 'var(--shadow-card)' } : undefined}
              >
                <tf.icon className="w-4 h-4" />
                {tf.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الملفات..."
                className="bg-card rounded-xl pr-9 pl-4 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-accent/50"
                style={{ boxShadow: 'var(--shadow-card)' }}
              />
            </div>
            <div className="flex bg-card rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Files */}
        {filesLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ تحميل الملفات...</div>
        ) : files.length > 0 ? (
          <MediaGrid files={files} onFileClick={setSelectedFile} viewMode={viewMode} />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد ملفات بعد</p>
          </div>
        )}

        {selectedFile && (
          <FileViewer
            file={selectedFile}
            files={files}
            onClose={() => setSelectedFile(null)}
            onNavigate={setSelectedFile}
          />
        )}

        {showUpload && id && (
          <FileUpload projectId={id} onClose={() => setShowUpload(false)} />
        )}
      </div>
    </AppLayout>
  );
}
