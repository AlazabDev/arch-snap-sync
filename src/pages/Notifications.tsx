import { Bell, Check } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/data/mockData';

export default function Notifications() {
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

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">الإشعارات</h1>
            <p className="text-muted-foreground mt-1">جميع التنبيهات والإشعارات</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`bg-card rounded-xl p-4 flex items-start gap-4 transition-all ${!n.is_read ? 'border-r-4 border-accent' : ''}`}
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? 'bg-accent/15' : 'bg-muted'}`}>
                  <Bell className={`w-5 h-5 ${!n.is_read ? 'text-accent' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{n.title}</p>
                  {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
                  <p className="text-xs text-muted-foreground mt-2">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent shrink-0 mt-2" />
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
