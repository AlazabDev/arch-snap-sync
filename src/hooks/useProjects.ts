import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  project_number: string;
  name: string;
  client_name: string | null;
  location: string | null;
  description: string | null;
  status: string;
  thumbnail_url: string | null;
  start_date: string | null;
  created_at: string;
  updated_at: string;
  files_count?: { images: number; videos: number; audio: number; pdf: number };
  total_size?: number;
}

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get file counts per project
      const { data: files } = await supabase
        .from('project_files')
        .select('project_id, file_type, file_size');

      const enriched = (projects || []).map((p) => {
        const projectFiles = (files || []).filter(f => f.project_id === p.id);
        return {
          ...p,
          files_count: {
            images: projectFiles.filter(f => f.file_type === 'image').length,
            videos: projectFiles.filter(f => f.file_type === 'video').length,
            audio: projectFiles.filter(f => f.file_type === 'audio').length,
            pdf: projectFiles.filter(f => f.file_type === 'pdf' || f.file_type === 'document').length,
          },
          total_size: projectFiles.reduce((sum, f) => sum + (f.file_size || 0), 0),
        };
      });

      return enriched as Project[];
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Project;
    },
    enabled: !!id,
  });
}

export function useProjectFiles(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-files', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data: projects } = await supabase
        .from('projects')
        .select('id, status');

      const { data: files } = await supabase
        .from('project_files')
        .select('file_size');

      const activeProjects = (projects || []).filter(p => p.status === 'active').length;
      const totalFiles = (files || []).length;
      const totalStorage = (files || []).reduce((sum, f) => sum + (f.file_size || 0), 0);

      return { activeProjects, totalFiles, totalStorage, activeConversations: 0 };
    },
  });
}
