import { BarChart3, Building2, FolderOpen, HardDrive } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useStats } from '@/hooks/useProjects';
import { formatFileSize } from '@/data/mockData';

export default function Reports() {
  const { data: stats } = useStats();

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">التقارير</h1>
          <p className="text-muted-foreground mt-1">إحصائيات وتقارير شاملة عن المشاريع</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">إجمالي المشاريع</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/15">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.activeProjects ?? 0}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">المشاريع النشطة</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[hsl(var(--success)/0.15)]">
                <Building2 className="w-5 h-5 text-[hsl(var(--success))]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.activeProjects ?? 0}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">إجمالي الملفات</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stats?.totalFiles ?? 0}</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">المساحة المستخدمة</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[hsl(var(--info)/0.15)]">
                <HardDrive className="w-5 h-5 text-[hsl(var(--info))]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatFileSize(stats?.totalStorage ?? 0)}</p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-8 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold text-foreground mb-2">التقارير التفصيلية قريباً</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            سيتم إضافة رسوم بيانية تفصيلية وتقارير قابلة للتصدير عن أداء المشاريع والملفات والمعاملات المالية
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
