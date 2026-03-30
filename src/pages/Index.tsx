import { Building2, FolderOpen, HardDrive, MessageSquare, Search, Plus, Wrench, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import StatCard from '@/components/dashboard/StatCard';
import ProjectCard from '@/components/dashboard/ProjectCard';
import CreateProject from '@/components/project/CreateProject';
import { useProjects, useStats } from '@/hooks/useProjects';
import { formatFileSize } from '@/data/mockData';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-accent/20 text-accent-foreground' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'طارئة', color: 'bg-destructive/15 text-destructive' },
};

export default function Index() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const { data: projects = [], isLoading } = useProjects();
  const { data: stats } = useStats();

  const { data: recentMaintenance = [] } = useQuery({
    queryKey: ['recent-maintenance'],
    queryFn: async () => {
      const { data } = await supabase
        .from('maintenance_requests')
        .select('id, ticket_number, title, status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: maintenanceStats } = useQuery({
    queryKey: ['maintenance-stats-dashboard'],
    queryFn: async () => {
      const { data } = await supabase.from('maintenance_requests').select('status');
      const all = data || [];
      return {
        total: all.length,
        new: all.filter(r => r.status === 'new').length,
        inProgress: all.filter(r => r.status === 'in_progress' || r.status === 'assigned').length,
        completed: all.filter(r => r.status === 'completed').length,
      };
    },
  });

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.includes(search) || p.project_number.includes(search) || (p.client_name || '').includes(search);
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1 text-sm">نظرة شاملة على مشاريعك وملفاتك</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            مشروع جديد
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="المشاريع النشطة" value={stats?.activeProjects ?? 0} icon={Building2} color="accent" />
          <StatCard label="إجمالي الملفات" value={(stats?.totalFiles ?? 0).toLocaleString('ar-SA')} icon={FolderOpen} color="primary" />
          <StatCard label="المساحة المستخدمة" value={formatFileSize(stats?.totalStorage ?? 0)} icon={HardDrive} color="success" />
          <StatCard label="طلبات الصيانة" value={maintenanceStats?.total ?? 0} icon={Wrench} color="info" />
        </div>

        {/* Maintenance Summary */}
        {(maintenanceStats?.total ?? 0) > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-accent" />
                  آخر طلبات الصيانة
                </CardTitle>
                <Link to="/maintenance" className="text-sm text-accent hover:underline">
                  عرض الكل ←
                </Link>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <AlertTriangle className="w-3 h-3 text-destructive" /> جديدة: {maintenanceStats?.new ?? 0}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3 text-accent" /> قيد التنفيذ: {maintenanceStats?.inProgress ?? 0}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3 h-3 text-[hsl(var(--success))]" /> مكتملة: {maintenanceStats?.completed ?? 0}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="divide-y divide-border">
                {recentMaintenance.map((req: any) => {
                  const priority = PRIORITY_MAP[req.priority] || PRIORITY_MAP.medium;
                  return (
                    <Link key={req.id} to="/maintenance" className="flex items-center justify-between py-2.5 hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-muted-foreground shrink-0">{req.ticket_number}</span>
                        <span className="text-sm text-foreground truncate">{req.title}</span>
                      </div>
                      <Badge variant="outline" className={`${priority.color} text-xs shrink-0`}>{priority.label}</Badge>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex items-center gap-4">
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
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد مشاريع بعد. ستظهر هنا عند استقبال ملفات من واتساب.</p>
              </div>
            )}
          </>
        )}
        {showCreate && <CreateProject onClose={() => setShowCreate(false)} />}
      </div>
    </AppLayout>
  );
}
