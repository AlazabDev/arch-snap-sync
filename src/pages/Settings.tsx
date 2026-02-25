import { Settings as SettingsIcon, User, Bell, Shield, Smartphone } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

export default function Settings() {
  const sections = [
    { icon: User, title: 'الملف الشخصي', desc: 'تعديل الاسم والبريد الإلكتروني والصورة الشخصية' },
    { icon: Smartphone, title: 'ربط واتساب', desc: 'إعدادات الويب هوك وأرقام الهاتف المرتبطة' },
    { icon: Bell, title: 'الإشعارات', desc: 'تخصيص أنواع الإشعارات التي تريد استقبالها' },
    { icon: Shield, title: 'الأمان والصلاحيات', desc: 'إدارة الأدوار وصلاحيات الوصول' },
  ];

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-muted-foreground mt-1">إدارة إعدادات النظام والحساب</p>
        </div>

        <div className="max-w-2xl space-y-4">
          {sections.map((s, i) => (
            <button
              key={i}
              className="w-full bg-card rounded-xl p-5 flex items-center gap-4 text-right hover:bg-muted/50 transition-colors"
              style={{ boxShadow: 'var(--shadow-card)' }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <s.icon className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
