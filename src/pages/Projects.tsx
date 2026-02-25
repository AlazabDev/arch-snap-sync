import { Building2, Plus, Search, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { useProjects } from '@/hooks/useProjects';

export default function Projects() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: projects = [], isLoading } = useProjects();

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.includes(search) || p.project_number.includes(search) || (p.client_name || '').includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">المشاريع</h1>
            <p className="text-muted-foreground mt-1">إدارة جميع مشاريعك المعمارية</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors">
            <Plus className="w-5 h-5" />
            مشروع جديد
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو رقم المشروع أو العميل..."
              className="w-full bg-card rounded-xl pr-10 pl-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 transition-shadow"
              style={{ boxShadow: 'var(--shadow-card)' }}
            />
          </div>
          <div className="flex gap-2">
            {['all', 'active', 'completed', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  statusFilter === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={statusFilter !== s ? { boxShadow: 'var(--shadow-card)' } : undefined}
              >
                {s === 'all' ? 'الكل' : s === 'active' ? 'نشط' : s === 'completed' ? 'مكتمل' : 'مؤرشف'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد مشاريع مطابقة للبحث</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
