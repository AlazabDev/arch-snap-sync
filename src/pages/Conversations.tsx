import { MessageSquare, Search } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function Conversations() {
  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">المحادثات</h1>
          <p className="text-muted-foreground mt-1">محادثات واتساب المرتبطة بالمشاريع</p>
        </div>

        <div className="text-center py-20 text-muted-foreground">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-accent/10 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">لا توجد محادثات بعد</h3>
          <p className="text-sm max-w-md mx-auto">
            ستظهر المحادثات هنا تلقائياً عند استقبال رسائل عبر واتساب. تأكد من ربط الويب هوك بشكل صحيح.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
