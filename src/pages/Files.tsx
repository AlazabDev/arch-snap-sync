import { FolderOpen, Search, Camera, Video, Mic, FileText, LayoutGrid, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import MediaGrid from '@/components/project/MediaGrid';
import FileViewer from '@/components/project/FileViewer';
import { useProjects, useProjectFiles } from '@/hooks/useProjects';
import { formatFileSize, formatDate, type FileType } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const typeFilters: { key: FileType | 'all'; label: string; icon: any }[] = [
  { key: 'all', label: 'الكل', icon: LayoutGrid },
  { key: 'image', label: 'صور', icon: Camera },
  { key: 'video', label: 'فيديو', icon: Video },
  { key: 'audio', label: 'صوتي', icon: Mic },
  { key: 'pdf', label: 'مستندات', icon: FileText },
];

export default function Files() {
  const [typeFilter, setTypeFilter] = useState<FileType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<any>(null);

  const { data: allFiles = [], isLoading } = useQuery({
    queryKey: ['all-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const mappedFiles = useMemo(() => {
    return allFiles.map(f => ({
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
  }, [allFiles]);

  const files = useMemo(() => {
    return mappedFiles
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .filter(f => f.name.includes(search) || f.sender.includes(search));
  }, [mappedFiles, typeFilter, search]);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">جميع الملفات</h1>
          <p className="text-muted-foreground mt-1">تصفح جميع ملفات المشاريع في مكان واحد</p>
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
              <button onClick={() => setViewMode('grid')} className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : files.length > 0 ? (
          <MediaGrid files={files} onFileClick={setSelectedFile} viewMode={viewMode} />
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد ملفات بعد</p>
          </div>
        )}

        {selectedFile && (
          <FileViewer file={selectedFile} files={files} onClose={() => setSelectedFile(null)} onNavigate={setSelectedFile} />
        )}
      </div>
    </AppLayout>
  );
}
