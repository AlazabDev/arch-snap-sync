import { Building2, FolderOpen, HardDrive, MessageSquare, Search, Bell } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import { projects, stats, formatFileSize } from '@/data/mockData';
import { useState } from 'react';

export default function Index() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.includes(search) || p.number.includes(search) || p.client.includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">نظرة شاملة على مشاريعك وملفاتك</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative w-10 h-10 rounded-xl bg-card flex items-center justify-center hover:bg-muted transition-colors" style={{ boxShadow: 'var(--shadow-card)' }}>
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute -top-1 -left-1 w-4 h-4 bg-accent rounded-full text-[10px] text-accent-foreground flex items-center justify-center font-bold">3</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <StatCard label="المشاريع النشطة" value={stats.activeProjects} icon={Building2} color="accent" />
          <StatCard label="إجمالي الملفات" value={stats.totalFiles.toLocaleString('ar-SA')} icon={FolderOpen} color="primary" />
          <StatCard label="المساحة المستخدمة" value={formatFileSize(stats.totalStorage)} icon={HardDrive} color="success" />
          <StatCard label="المحادثات النشطة" value={stats.activeConversations} icon={MessageSquare} color="info" />
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في المشاريع..."
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

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد مشاريع مطابقة</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
