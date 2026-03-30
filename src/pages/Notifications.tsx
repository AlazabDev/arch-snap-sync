import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function Notifications() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unread.length === 0) return;
      for (const id of unread) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'تم تعليم الكل كمقروء' });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const typeIcon: Record<string, string> = {
    info: '💡',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    maintenance: '🔧',
    file: '📁',
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-7 h-7 text-accent" />
              الإشعارات
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">جميع التنبيهات والإشعارات</p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 ml-2" />
              تعليم الكل كمقروء
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-card rounded-xl p-4 flex items-start gap-4 transition-all cursor-pointer hover:shadow-md ${!n.is_read ? 'border-r-4 border-accent' : 'opacity-75'}`}
                style={{ boxShadow: 'var(--shadow-card)' }}
                onClick={() => !n.is_read && markReadMutation.mutate(n.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${!n.is_read ? 'bg-accent/15' : 'bg-muted'}`}>
                  {typeIcon[n.type || 'info'] || '💡'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-foreground ${!n.is_read ? '' : 'text-muted-foreground'}`}>{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
              <Bell className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد إشعارات</h3>
            <p className="text-sm">ستظهر الإشعارات هنا عند وجود تحديثات على مشاريعك</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
