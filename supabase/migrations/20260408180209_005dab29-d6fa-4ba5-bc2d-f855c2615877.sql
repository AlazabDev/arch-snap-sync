
CREATE TABLE public.cloud_storage_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL CHECK (provider_type IN ('s3', 'oci', 'gcp')),
  bucket_name TEXT NOT NULL,
  region TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cloud_storage_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage cloud storage providers"
ON public.cloud_storage_providers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_cloud_storage_providers_updated_at
BEFORE UPDATE ON public.cloud_storage_providers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
