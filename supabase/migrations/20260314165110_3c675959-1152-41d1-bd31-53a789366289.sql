-- Maintenance request priority enum
CREATE TYPE public.maintenance_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Maintenance request status enum
CREATE TYPE public.maintenance_status AS ENUM ('new', 'assigned', 'in_progress', 'completed', 'cancelled');

-- Fault category enum
CREATE TYPE public.fault_category AS ENUM ('electrical', 'plumbing', 'hvac', 'structural', 'painting', 'carpentry', 'cleaning', 'other');

-- Main maintenance requests table
CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL DEFAULT '',
  
  -- Fault details
  title text NOT NULL,
  description text,
  fault_category public.fault_category NOT NULL DEFAULT 'other',
  priority public.maintenance_priority NOT NULL DEFAULT 'medium',
  status public.maintenance_status NOT NULL DEFAULT 'new',
  
  -- Location
  building text,
  unit text,
  floor text,
  
  -- Requester info
  requester_name text NOT NULL,
  requester_phone text,
  requester_email text,
  
  -- Source tracking
  source text NOT NULL DEFAULT 'web',
  source_reference text,
  
  -- Assignment
  assigned_to uuid,
  assigned_at timestamptz,
  
  -- Resolution
  resolution_notes text,
  completed_at timestamptz,
  
  -- Attachments stored as JSON array of URLs
  attachments jsonb DEFAULT '[]'::jsonb,
  
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add unique constraint on ticket_number
ALTER TABLE public.maintenance_requests ADD CONSTRAINT maintenance_requests_ticket_number_unique UNIQUE (ticket_number);

-- Auto-update updated_at
CREATE TRIGGER update_maintenance_requests_updated_at
  BEFORE UPDATE ON public.maintenance_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  seq_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 'MNT-\d{4}-(\d+)') AS integer)), 0) + 1
  INTO seq_num
  FROM public.maintenance_requests
  WHERE ticket_number LIKE 'MNT-' || to_char(now(), 'YYYY') || '-%';
  
  NEW.ticket_number := 'MNT-' || to_char(now(), 'YYYY') || '-' || LPAD(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.maintenance_requests
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- RLS Policies
CREATE POLICY "Admins manage all maintenance requests"
  ON public.maintenance_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users create maintenance requests"
  ON public.maintenance_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users view own maintenance requests"
  ON public.maintenance_requests FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "Assigned users update maintenance requests"
  ON public.maintenance_requests FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "API gateway inserts"
  ON public.maintenance_requests FOR INSERT
  TO anon
  WITH CHECK (source IN ('whatsapp', 'erp', 'app', 'form'));

CREATE POLICY "Public ticket lookup"
  ON public.maintenance_requests FOR SELECT
  TO anon
  USING (true);