import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Camera, Video, Mic, FileText, Search, LayoutGrid, List, MapPin, Calendar } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import MediaGrid from '@/components/project/MediaGrid';
import FileViewer from '@/components/project/FileViewer';
import { projects, projectFiles, formatDate, formatFileSize, getStatusLabel, getStatusClass, type ProjectFile, type FileType } from '@/data/mockData';

const typeFilters: { key: FileType | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'الكل', icon: LayoutGrid },
  { key: 'image', label: 'صور', icon: Camera },
  { key: 'video', label: 'فيديو', icon: Video },
  { key: 'audio', label: 'صوتي', icon: Mic },
  { key: 'pdf', label: 'مستندات', icon: FileText },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  const [typeFilter, setTypeFilter] = useState<FileType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);

  const files = useMemo(() => {
    return projectFiles
      .filter(f => f.projectId === id)
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .filter(f => f.name.includes(search) || f.sender.includes(search));
  }, [id, typeFilter, search]);

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
          <div className="h-48 overflow-hidden">
            <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/30 to-transparent" />
          </div>
          <div className="absolute bottom-0 inset-x-0 p-6 text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                  <span className={`badge-status ${getStatusClass(project.status)}`}>{getStatusLabel(project.status)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm opacity-80">
                  <span>{project.number}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{project.location}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(project.startDate)}</span>
                </div>
              </div>
              <div className="text-left text-sm opacity-80">
                <p>{project.client}</p>
                <p>{formatFileSize(project.totalSize)} مستخدمة</p>
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
        {files.length > 0 ? (
          <MediaGrid files={files} onFileClick={setSelectedFile} viewMode={viewMode} />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد ملفات مطابقة</p>
          </div>
        )}

        {/* File viewer modal */}
        {selectedFile && (
          <FileViewer
            file={selectedFile}
            files={files}
            onClose={() => setSelectedFile(null)}
            onNavigate={setSelectedFile}
          />
        )}
      </div>
    </AppLayout>
  );
}
