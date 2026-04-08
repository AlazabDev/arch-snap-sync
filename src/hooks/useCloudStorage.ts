import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type ProviderType = "s3" | "oci" | "gcp";

export interface CloudProvider {
  id: string;
  name: string;
  provider_type: ProviderType;
  bucket_name: string;
  region: string | null;
  is_active: boolean;
  config: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface StorageObject {
  key: string;
  size: number;
  last_modified: string;
}

export function useCloudProviders() {
  return useQuery({
    queryKey: ["cloud-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cloud_storage_providers")
        .select("*")
        .order("created_at");
      if (error) throw error;
      return data as CloudProvider[];
    },
  });
}

export function useAddProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (provider: {
      name: string;
      provider_type: ProviderType;
      bucket_name: string;
      region?: string;
      config?: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from("cloud_storage_providers")
        .insert(provider)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloud-providers"] });
      toast({ title: "تم إضافة المزود بنجاح" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cloud_storage_providers")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloud-providers"] });
      toast({ title: "تم حذف المزود" });
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    },
  });
}

export function useToggleProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("cloud_storage_providers")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloud-providers"] });
    },
  });
}

export function useListObjects(providerId: string | null, prefix: string) {
  return useQuery({
    queryKey: ["cloud-objects", providerId, prefix],
    enabled: !!providerId,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("cloud-storage", {
        body: { action: "list-objects", provider_id: providerId, prefix },
      });
      if (error) throw error;
      return data as { files: StorageObject[]; folders: string[] };
    },
  });
}

export function useTestConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (providerId: string) => {
      const { data, error } = await supabase.functions.invoke("cloud-storage", {
        body: { action: "test-connection", provider_id: providerId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({ title: "الاتصال ناجح ✅" });
      } else {
        toast({ title: "فشل الاتصال", description: data.error, variant: "destructive" });
      }
    },
  });
}

export function useDeleteObject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ providerId, key }: { providerId: string; key: string }) => {
      const { data, error } = await supabase.functions.invoke("cloud-storage", {
        body: { action: "delete-object", provider_id: providerId, key },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cloud-objects"] });
      toast({ title: "تم حذف الملف" });
    },
  });
}
