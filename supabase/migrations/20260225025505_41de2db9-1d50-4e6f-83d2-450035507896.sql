
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'architect', 'consultant', 'contractor', 'client', 'viewer');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- RLS on user_roles
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (user_id = auth.uid());

-- Drop ALL policies that depend on profiles.role FIRST
DROP POLICY IF EXISTS "Admins can do everything on projects" ON public.projects;
DROP POLICY IF EXISTS "Admins manage project members" ON public.project_members;
DROP POLICY IF EXISTS "Admins manage all files" ON public.project_files;
DROP POLICY IF EXISTS "View comments on accessible files" ON public.file_comments;
DROP POLICY IF EXISTS "Admins manage transactions" ON public.daftra_transactions;
DROP POLICY IF EXISTS "Admins delete files" ON storage.objects;
DROP POLICY IF EXISTS "Service role inserts files" ON public.project_files;
DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;

-- Now safe to drop role column
ALTER TABLE public.profiles DROP COLUMN role;

-- Recreate policies using has_role function
CREATE POLICY "Admins can do everything on projects" ON public.projects
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage project members" ON public.project_members
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all files" ON public.project_files
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated insert files" ON public.project_files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "View comments on accessible files" ON public.file_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.project_files pf
      JOIN public.project_members pm ON pm.project_id = pf.project_id
      WHERE pf.id = file_comments.file_id AND pm.user_id = auth.uid()
    ) OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins manage transactions" ON public.daftra_transactions
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete files" ON storage.objects
  FOR DELETE USING (bucket_id = 'project-files' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
