ALTER TABLE public.systems 
ADD COLUMN has_interfaces boolean DEFAULT false,
ADD COLUMN usage_status text DEFAULT 'in_use';