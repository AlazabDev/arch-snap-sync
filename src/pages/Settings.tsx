import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Smartphone, Save, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('user_id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({ title: 'تم الحفظ', description: 'تم تحديث الملف الشخصي بنجاح' });
    },
    onError: () => toast({ title: 'خطأ', description: 'فشل في حفظ التغييرات', variant: 'destructive' }),
  });

  const { data: userRoles = [] } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
      return data || [];
    },
    enabled: !!user?.id,
  });

  const roleLabels: Record<string, string> = {
    admin: 'مدير النظام',
    architect: 'مهندس معماري',
    consultant: 'استشاري',
    contractor: 'مقاول',
    client: 'عميل',
    viewer: 'مشاهد',
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="w-7 h-7 text-accent" />
            الإعدادات
          </h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة إعدادات الحساب والنظام</p>
        </div>

        <Tabs defaultValue="profile" dir="rtl" className="max-w-2xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              الملف الشخصي
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الأمان
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              واتساب
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">المعلومات الشخصية</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">جارٍ التحميل...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input
                        value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={form.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">البريد الإلكتروني مرتبط بحساب المصادقة ولا يمكن تغييره من هنا</p>
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <Input
                        value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })}
                        placeholder="+966 5xx xxx xxxx"
                        dir="ltr"
                        className="text-left"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الأدوار</Label>
                      <div className="flex flex-wrap gap-2">
                        {userRoles.length > 0 ? (
                          userRoles.map((r, i) => (
                            <span key={i} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                              {roleLabels[r.role] || r.role}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">لا توجد أدوار محددة</span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => updateMutation.mutate(form)}
                      disabled={updateMutation.isPending}
                      className="mt-4"
                    >
                      {updateMutation.isPending ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 ml-2" />
                      )}
                      حفظ التغييرات
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">الأمان والصلاحيات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>معرّف المستخدم</Label>
                  <Input value={user?.id || ''} disabled className="bg-muted font-mono text-xs" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>طريقة المصادقة</Label>
                  <Input
                    value={user?.app_metadata?.provider === 'google' ? 'Google' : 'بريد إلكتروني وكلمة مرور'}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>آخر تسجيل دخول</Label>
                  <Input
                    value={user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('ar-SA') : '-'}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="whatsapp" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">إعدادات واتساب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Smartphone className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">إعدادات الويب هوك</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    يتم إدارة إعدادات الويب هوك وأرقام واتساب من خلال لوحة تحكم Supabase Edge Functions.
                  </p>
                  <a
                    href="https://supabase.com/dashboard/project/fjojyzvulhvqeitnaenv/functions/whatsapp-webhook/logs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-4 text-sm text-accent hover:underline"
                  >
                    فتح سجلات الويب هوك ←
                  </a>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
