import { FileText, Plus, Search, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/data/mockData';

export default function Accounting() {
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daftra_transactions')
        .select('*')
        .order('transaction_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter(t => t.transaction_type === filter);
  }, [transactions, filter]);

  const totalIncome = transactions.filter(t => t.transaction_type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.transaction_type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">الدفترة</h1>
            <p className="text-muted-foreground mt-1">إدارة المعاملات المالية للمشاريع</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors">
            <Plus className="w-5 h-5" />
            معاملة جديدة
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">الإيرادات</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[hsl(var(--success)/0.15)]">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--success))]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalIncome.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">المصروفات</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-destructive/15">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{totalExpense.toLocaleString('ar-SA')} ر.س</p>
          </div>
          <div className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">الصافي</span>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/15">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{(totalIncome - totalExpense).toLocaleString('ar-SA')} ر.س</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
              }`}
              style={filter !== f ? { boxShadow: 'var(--shadow-card)' } : undefined}
            >
              {f === 'all' ? 'الكل' : f === 'income' ? 'إيرادات' : 'مصروفات'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">جارٍ التحميل...</div>
        ) : filtered.length > 0 ? (
          <div className="bg-card rounded-xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-right py-3 px-4 font-medium">الوصف</th>
                  <th className="text-right py-3 px-4 font-medium">النوع</th>
                  <th className="text-right py-3 px-4 font-medium">المبلغ</th>
                  <th className="text-right py-3 px-4 font-medium">الحالة</th>
                  <th className="text-right py-3 px-4 font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-foreground">{t.description}</td>
                    <td className="py-3 px-4">
                      <span className={`badge-status ${t.transaction_type === 'income' ? 'badge-active' : 'badge-completed'}`}>
                        {t.transaction_type === 'income' ? 'إيراد' : 'مصروف'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{Number(t.amount).toLocaleString('ar-SA')} ر.س</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.status === 'pending' ? 'معلّق' : t.status === 'approved' ? 'معتمد' : t.status}</td>
                    <td className="py-3 px-4 text-muted-foreground">{formatDate(t.transaction_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>لا توجد معاملات مالية بعد</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
