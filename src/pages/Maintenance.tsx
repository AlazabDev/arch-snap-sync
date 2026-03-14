import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Wrench, Plus, Search, Clock, CheckCircle2, AlertTriangle, User, MapPin, Filter } from 'lucide-react';

const PRIORITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: 'منخفضة', color: 'bg-muted text-muted-foreground' },
  medium: { label: 'متوسطة', color: 'bg-accent/20 text-accent-foreground' },
  high: { label: 'عالية', color: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'طارئة', color: 'bg-destructive/15 text-destructive' },
};

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock }> = {
  new: { label: 'جديد', icon: AlertTriangle },
  assigned: { label: 'معيّن', icon: User },
  in_progress: { label: 'قيد التنفيذ', icon: Clock },
  completed: { label: 'مكتمل', icon: CheckCircle2 },
  cancelled: { label: 'ملغي', icon: AlertTriangle },
};

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

const SOURCE_MAP: Record<string, string> = {
  whatsapp: 'واتساب',
  form: 'نموذج',
  erp: 'ERP',
  app: 'تطبيق',
  web: 'ويب',
};

export default function Maintenance() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['maintenance-requests', statusFilter, priorityFilter],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert({
          ...formData,
          source: 'web',
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      setIsCreateOpen(false);
      toast({ title: 'تم إنشاء الطلب', description: `رقم التذكرة: ${data.ticket_number}` });
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في إنشاء الطلب', variant: 'destructive' }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, resolution_notes }: { id: string; status: string; resolution_notes?: string }) => {
      const updates: any = { status };
      if (status === 'assigned') updates.assigned_to = user?.id;
      if (status === 'assigned') updates.assigned_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      if (resolution_notes) updates.resolution_notes = resolution_notes;

      const { error } = await supabase.from('maintenance_requests').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-requests'] });
      setSelectedRequest(null);
      toast({ title: 'تم تحديث الحالة' });
    },
  });

  const filtered = requests.filter((r: any) =>
    !search || r.title?.includes(search) || r.ticket_number?.includes(search) || r.requester_name?.includes(search)
  );

  const stats = {
    total: requests.length,
    new: requests.filter((r: any) => r.status === 'new').length,
    in_progress: requests.filter((r: any) => r.status === 'in_progress' || r.status === 'assigned').length,
    completed: requests.filter((r: any) => r.status === 'completed').length,
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wrench className="w-7 h-7 text-accent" />
              إدارة طلبات الصيانة
            </h1>
            <p className="text-muted-foreground text-sm mt-1">بوابة موحدة لجميع طلبات الصيانة</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 ml-2" />طلب صيانة جديد</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>طلب صيانة جديد</DialogTitle>
              </DialogHeader>
              <CreateRequestForm onSubmit={(data: any) => createMutation.mutate(data)} isLoading={createMutation.isPending} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatMini label="إجمالي الطلبات" value={stats.total} icon={Wrench} />
          <StatMini label="جديدة" value={stats.new} icon={AlertTriangle} />
          <StatMini label="قيد التنفيذ" value={stats.in_progress} icon={Clock} />
          <StatMini label="مكتملة" value={stats.completed} icon={CheckCircle2} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالعنوان أو رقم التذكرة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 ml-2" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="new">جديد</SelectItem>
              <SelectItem value="assigned">معيّن</SelectItem>
              <SelectItem value="in_progress">قيد التنفيذ</SelectItem>
              <SelectItem value="completed">مكتمل</SelectItem>
              <SelectItem value="cancelled">ملغي</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="الأولوية" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              <SelectItem value="urgent">طارئة</SelectItem>
              <SelectItem value="high">عالية</SelectItem>
              <SelectItem value="medium">متوسطة</SelectItem>
              <SelectItem value="low">منخفضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Request List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Wrench className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">لا توجد طلبات صيانة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((req: any) => {
              const priority = PRIORITY_MAP[req.priority] || PRIORITY_MAP.medium;
              const status = STATUS_MAP[req.status] || STATUS_MAP.new;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={req.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedRequest(req)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{req.ticket_number}</span>
                          <Badge variant="outline" className={priority.color}>{priority.label}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            <StatusIcon className="w-3 h-3 ml-1" />{status.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{SOURCE_MAP[req.source] || req.source}</Badge>
                        </div>
                        <h3 className="font-semibold text-foreground truncate">{req.title}</h3>
                        {req.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{req.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />{req.requester_name}
                          </span>
                          {req.building && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{req.building}{req.unit ? ` - ${req.unit}` : ''}
                            </span>
                          )}
                          <span>{CATEGORY_MAP[req.fault_category] || req.fault_category}</span>
                          <span>{new Date(req.created_at).toLocaleDateString('ar-SA')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedRequest && (
              <RequestDetail
                request={selectedRequest}
                onUpdateStatus={(status: string, notes?: string) =>
                  updateStatusMutation.mutate({ id: selectedRequest.id, status, resolution_notes: notes })
                }
                isUpdating={updateStatusMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function StatMini({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateRequestForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    fault_category: 'other',
    priority: 'medium',
    building: '',
    unit: '',
    floor: '',
    requester_name: '',
    requester_phone: '',
    requester_email: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.requester_name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label>عنوان الطلب *</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="col-span-2">
          <Label>الوصف</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </div>
        <div>
          <Label>نوع العطل</Label>
          <Select value={form.fault_category} onValueChange={(v) => setForm({ ...form, fault_category: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>الأولوية</Label>
          <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>المبنى</Label>
          <Input value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} />
        </div>
        <div>
          <Label>الوحدة</Label>
          <Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
        </div>
        <div>
          <Label>اسم مقدم الطلب *</Label>
          <Input value={form.requester_name} onChange={(e) => setForm({ ...form, requester_name: e.target.value })} required />
        </div>
        <div>
          <Label>هاتف مقدم الطلب</Label>
          <Input value={form.requester_phone} onChange={(e) => setForm({ ...form, requester_phone: e.target.value })} />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
      </Button>
    </form>
  );
}

function RequestDetail({ request, onUpdateStatus, isUpdating }: { request: any; onUpdateStatus: (status: string, notes?: string) => void; isUpdating: boolean }) {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const priority = PRIORITY_MAP[request.priority] || PRIORITY_MAP.medium;
  const status = STATUS_MAP[request.status] || STATUS_MAP.new;

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="font-mono text-sm text-muted-foreground">{request.ticket_number}</span>
          <Badge className={priority.color}>{priority.label}</Badge>
        </DialogTitle>
      </DialogHeader>

      <div>
        <h2 className="text-lg font-bold text-foreground">{request.title}</h2>
        {request.description && <p className="text-muted-foreground mt-1">{request.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-muted-foreground">النوع:</span> {CATEGORY_MAP[request.fault_category]}</div>
        <div><span className="text-muted-foreground">المصدر:</span> {SOURCE_MAP[request.source] || request.source}</div>
        <div><span className="text-muted-foreground">مقدم الطلب:</span> {request.requester_name}</div>
        {request.requester_phone && <div><span className="text-muted-foreground">الهاتف:</span> {request.requester_phone}</div>}
        {request.building && <div><span className="text-muted-foreground">المبنى:</span> {request.building}</div>}
        {request.unit && <div><span className="text-muted-foreground">الوحدة:</span> {request.unit}</div>}
        <div><span className="text-muted-foreground">تاريخ الإنشاء:</span> {new Date(request.created_at).toLocaleString('ar-SA')}</div>
        <div><span className="text-muted-foreground">الحالة:</span> {status.label}</div>
      </div>

      {request.attachments?.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">المرفقات</h4>
          <div className="flex flex-wrap gap-2">
            {request.attachments.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">
                مرفق {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {request.resolution_notes && (
        <div className="p-3 rounded-lg bg-muted">
          <h4 className="font-semibold text-sm mb-1">ملاحظات الحل</h4>
          <p className="text-sm text-muted-foreground">{request.resolution_notes}</p>
        </div>
      )}

      {/* Actions */}
      {request.status !== 'completed' && request.status !== 'cancelled' && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-semibold text-sm">تحديث الحالة</h4>
          {request.status === 'new' && (
            <Button onClick={() => onUpdateStatus('assigned')} disabled={isUpdating} className="w-full">
              قبول وتعيين الطلب
            </Button>
          )}
          {(request.status === 'assigned' || request.status === 'new') && (
            <Button onClick={() => onUpdateStatus('in_progress')} disabled={isUpdating} variant="outline" className="w-full">
              بدء التنفيذ
            </Button>
          )}
          {request.status === 'in_progress' && (
            <div className="space-y-2">
              <Textarea
                placeholder="ملاحظات الحل..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
              <Button
                onClick={() => onUpdateStatus('completed', resolutionNotes)}
                disabled={isUpdating}
                className="w-full"
              >
                إتمام الطلب
              </Button>
            </div>
          )}
          <Button
            onClick={() => onUpdateStatus('cancelled')}
            disabled={isUpdating}
            variant="destructive"
            className="w-full"
          >
            إلغاء الطلب
          </Button>
        </div>
      )}
    </div>
  );
}
