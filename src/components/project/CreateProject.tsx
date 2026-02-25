import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { X, Building2, MapPin, Calendar, User } from 'lucide-react';

interface CreateProjectProps {
  onClose: () => void;
}

export default function CreateProject({ onClose }: CreateProjectProps) {
  const [name, setName] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('projects').insert({
        name,
        project_number: projectNumber,
        client_name: clientName || null,
        location: location || null,
        description: description || null,
        created_by: user.id,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: 'تم إنشاء المشروع بنجاح' });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      onClose();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 glass-overlay flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-lg" style={{ boxShadow: 'var(--shadow-elevated)' }}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">مشروع جديد</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">اسم المشروع *</label>
            <div className="relative">
              <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: برج الواحة السكني"
                className="w-full bg-muted rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">رقم المشروع *</label>
            <input
              value={projectNumber}
              onChange={(e) => setProjectNumber(e.target.value)}
              required
              placeholder="مثال: PRJ-2026-001"
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">اسم العميل</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="مثال: شركة الواحة للتطوير"
                className="w-full bg-muted rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">الموقع</label>
            <div className="relative">
              <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="مثال: الرياض - حي الملقا"
                className="w-full bg-muted rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="وصف مختصر للمشروع..."
              rows={3}
              className="w-full bg-muted rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || !name || !projectNumber}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء المشروع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
