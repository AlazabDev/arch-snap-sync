
-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'), NEW.email);
  RETURN NEW;
END;
$$;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow authenticated users to insert projects
CREATE POLICY "Authenticated users can insert projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update their own projects
CREATE POLICY "Authenticated users can update own projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

-- Allow anon read for projects (public listing when not logged in - optional, remove if unwanted)
-- We keep existing policies that require membership, but add a policy for creators
CREATE POLICY "Creators can view own projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Allow project file insert for authenticated users (already exists but let's ensure WITH CHECK has auth)
-- Already exists: "Authenticated insert files" policy

-- Allow authenticated users to view their own project files (as creator)
CREATE POLICY "Creators view own project files"
  ON public.project_files FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = project_files.project_id AND projects.created_by = auth.uid()
  ));
