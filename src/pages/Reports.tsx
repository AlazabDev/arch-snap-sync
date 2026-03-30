import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Building2, FolderOpen, HardDrive, Wrench, TrendingUp, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { formatFileSize } from '@/data/mockData';

const COLORS = [
  'hsl(35, 70%, 50%)',
  'hsl(220, 25%, 25%)',
  'hsl(150, 50%, 40%)',
  'hsl(210, 70%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(40, 90%, 50%)',
  'hsl(280, 60%, 50%)',
  'hsl(170, 50%, 45%)',
];

const CATEGORY_MAP: Record<string, string> = {
  electrical: 'كهرباء',
  plumbing: 'سباكة',
  hvac: 'تكييف',
  structural: 'إنشائي',
  painting: 'دهانات',
  carpentry: 'نجارة',
  cleaning: 'نظافة',
  other: 'أخرى',
};

export default function Reports() {
  const [period, setPeriod] = useState('30');

  const { data: projectStats } = useQuery({
    queryKey: ['report-projects'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name, status, created_at');
      return data || [];
    },
  });

  const { data: fileStats } = useQuery({
    queryKey: ['report-files'],
    queryFn: async () => {
      const { data } = await supabase.from('project_files').select('file_type, file_size, created_at, project_id');
      return data || [];
    },
  });

  const { data: maintenanceStats } = useQuery({
    queryKey: ['report-maintenance'],
    queryFn: async () => {
      const { data } = await supabase.from('maintenance_requests').select('status, priority, fault_category, source, created_at');
      return data || [];
    },
  });

  // Project status distribution
  const projectStatusData = (() => {
    const counts: Record<string, number> = { active: 0, completed: 0, archived: 0 };
    (projectStats || []).forEach(p => { counts[p.status] = (counts[p.status] || 0) + 1; });
    return [
      { name: 'نشط', value: counts.active, fill: COLORS[2] },
      { name: 'مكتمل', value: counts.completed, fill: COLORS[0] },
      { name: 'مؤرشف', value: counts.archived, fill: COLORS[1] },
    ].filter(d => d.value > 0);
  })();

  // File types distribution
  const fileTypeData = (() => {
    const counts: Record<string, number> = {};
    (fileStats || []).forEach(f => { counts[f.file_type] = (counts[f.file_type] || 0) + 1; });
    const labels: Record<string, string> = { image: 'صور', video: 'فيديو', audio: 'صوت', pdf: 'مستندات', document: 'مستندات' };
    return Object.entries(counts).map(([k, v], i) => ({ name: labels[k] || k, value: v, fill: COLORS[i % COLORS.length] }));
  })();

  // Maintenance by category
  const maintenanceCategoryData = (() => {
    const counts: Record<string, number> = {};
    (maintenanceStats || []).forEach(m => { counts[m.fault_category] = (counts[m.fault_category] || 0) + 1; });
    return Object.entries(counts).map(([k, v], i) => ({ name: CATEGORY_MAP[k] || k, value: v, fill: COLORS[i % COLORS.length] }));
  })();

  // Maintenance by status
  const maintenanceStatusData = (() => {
    const statusLabels: Record<string, string> = { new: 'جديد', assigned: 'معيّن', in_progress: 'قيد التنفيذ', completed: 'مكتمل', cancelled: 'ملغي' };
    const counts: Record<string, number> = {};
    (maintenanceStats || []).forEach(m => { counts[m.status] = (counts[m.status] || 0) + 1; });
    return Object.entries(counts).map(([k, v]) => ({ name: statusLabels[k] || k, count: v }));
  })();

  // Maintenance by source
  const maintenanceSourceData = (() => {
    const sourceLabels: Record<string, string> = { whatsapp: 'واتساب', form: 'نموذج', erp: 'ERP', app: 'تطبيق', web: 'ويب' };
    const counts: Record<string, number> = {};
    (maintenanceStats || []).forEach(m => { counts[m.source] = (counts[m.source] || 0) + 1; });
    return Object.entries(counts).map(([k, v], i) => ({ name: sourceLabels[k] || k, value: v, fill: COLORS[i % COLORS.length] }));
  })();

  // Monthly trends
  const monthlyData = (() => {
    const months: Record<string, { files: number; maintenance: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = { files: 0, maintenance: 0 };
    }
    (fileStats || []).forEach(f => {
      const key = f.created_at.substring(0, 7);
      if (months[key]) months[key].files++;
    });
    (maintenanceStats || []).forEach(m => {
      const key = m.created_at.substring(0, 7);
      if (months[key]) months[key].maintenance++;
    });
    return Object.entries(months).map(([k, v]) => ({
      month: new Date(k + '-01').toLocaleDateString('ar-SA', { month: 'short' }),
      ملفات: v.files,
      صيانة: v.maintenance,
    }));
  })();

  const totalFiles = (fileStats || []).length;
  const totalStorage = (fileStats || []).reduce((s, f) => s + (f.file_size || 0), 0);
  const totalMaintenance = (maintenanceStats || []).length;
  const completedMaintenance = (maintenanceStats || []).filter(m => m.status === 'completed').length;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-accent" />
              التقارير والإحصائيات
            </h1>
            <p className="text-muted-foreground text-sm mt-1">تحليل شامل لأداء النظام والمشاريع</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{(projectStats || []).length}</p>
                <p className="text-xs text-muted-foreground">إجمالي المشاريع</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalFiles}</p>
                <p className="text-xs text-muted-foreground">إجمالي الملفات</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--info)/.1)] flex items-center justify-center">
                <HardDrive className="w-5 h-5 text-[hsl(var(--info))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{formatFileSize(totalStorage)}</p>
                <p className="text-xs text-muted-foreground">المساحة المستخدمة</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--success)/.1)] flex items-center justify-center">
                <Wrench className="w-5 h-5 text-[hsl(var(--success))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalMaintenance}</p>
                <p className="text-xs text-muted-foreground">طلبات الصيانة ({completedMaintenance} مكتملة)</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-accent" />
                الاتجاهات الشهرية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(35, 15%, 88%)', direction: 'rtl' }} />
                  <Legend />
                  <Line type="monotone" dataKey="ملفات" stroke="hsl(210, 70%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="صيانة" stroke="hsl(35, 70%, 50%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Project Status Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-accent" />
                توزيع المشاريع
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie data={projectStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {projectStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>

          {/* File Types Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-accent" />
                توزيع أنواع الملفات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fileTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie data={fileTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {fileTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">لا توجد ملفات</p>
              )}
            </CardContent>
          </Card>

          {/* Maintenance by Status Bar */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-accent" />
                طلبات الصيانة حسب الحالة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={maintenanceStatusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', direction: 'rtl' }} />
                    <Bar dataKey="count" fill="hsl(35, 70%, 50%)" radius={[6, 6, 0, 0]} name="عدد الطلبات" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">لا توجد طلبات صيانة</p>
              )}
            </CardContent>
          </Card>

          {/* Maintenance by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="w-5 h-5 text-accent" />
                الصيانة حسب نوع العطل
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPie>
                    <Pie data={maintenanceCategoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {maintenanceCategoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>

          {/* Maintenance by Source */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                مصادر طلبات الصيانة
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceSourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={maintenanceSourceData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ borderRadius: '8px', direction: 'rtl' }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} name="عدد الطلبات">
                      {maintenanceSourceData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">لا توجد بيانات</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
