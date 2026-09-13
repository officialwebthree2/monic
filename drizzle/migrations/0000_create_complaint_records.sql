CREATE TABLE public.complaint_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  matric_no TEXT NOT NULL,
  payment_1k TEXT NOT NULL DEFAULT '',
  complain TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.complaint_records TO authenticated;
GRANT ALL ON public.complaint_records TO service_role;

ALTER TABLE public.complaint_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read complaint records"
  ON public.complaint_records FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anyone can add complaint records"
  ON public.complaint_records FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Anyone can delete complaint records"
  ON public.complaint_records FOR DELETE TO anon, authenticated USING (true);