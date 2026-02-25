
-- =============================================
-- 1. Profiles table (linked to auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'architect', 'consultant', 'contractor', 'client', 'viewer')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 2. Projects table
-- =============================================
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  thumbnail_url TEXT,
  start_date DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. Project members (who has access to which project)
-- =============================================
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'download', 'upload', 'edit', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. Project files
-- =============================================
CREATE TABLE public.project_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video', 'audio', 'pdf', 'document', 'other')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  page_count INTEGER,
  sender_name TEXT,
  sender_phone TEXT,
  whatsapp_message_id TEXT,
  caption TEXT,
  storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. File comments
-- =============================================
CREATE TABLE public.file_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.project_files(id) ON DELETE CASCADE,
  user_id UUID,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. Daftra transactions
-- =============================================
CREATE TABLE public.daftra_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.project_files(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  daftra_reference TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'failed')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daftra_transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. Notifications
-- =============================================
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'file', 'comment', 'transaction')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Projects: admins see all, members see their projects
CREATE POLICY "Admins can do everything on projects" ON public.projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members can view their projects" ON public.projects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = projects.id AND user_id = auth.uid())
  );

-- Project members: admins manage, members view own memberships
CREATE POLICY "Admins manage project members" ON public.project_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members view own memberships" ON public.project_members
  FOR SELECT USING (user_id = auth.uid());

-- Project files: access through project membership
CREATE POLICY "Admins manage all files" ON public.project_files
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members view project files" ON public.project_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = project_files.project_id AND user_id = auth.uid())
  );

-- Allow service role to insert files (from webhook)
CREATE POLICY "Service role inserts files" ON public.project_files
  FOR INSERT WITH CHECK (true);

-- File comments: viewable by project members, insertable by authenticated
CREATE POLICY "View comments on accessible files" ON public.file_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_files pf
      JOIN public.project_members pm ON pm.project_id = pf.project_id
      WHERE pf.id = file_comments.file_id AND pm.user_id = auth.uid()
    ) OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users add comments" ON public.file_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Daftra transactions: project members can view, admins manage
CREATE POLICY "Admins manage transactions" ON public.daftra_transactions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Members view project transactions" ON public.daftra_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.project_members WHERE project_id = daftra_transactions.project_id AND user_id = auth.uid())
  );

-- Notifications: users see their own
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- =============================================
-- Updated_at trigger function
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_files_updated_at BEFORE UPDATE ON public.project_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- Storage bucket for project files
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', true);

CREATE POLICY "Anyone can view project files" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-files');

CREATE POLICY "Authenticated users upload files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "Admins delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-files' AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin'));
