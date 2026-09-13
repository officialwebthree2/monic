CREATE UNIQUE INDEX IF NOT EXISTS complaint_records_matric_no_key
  ON public.complaint_records (lower(matric_no));

GRANT UPDATE ON public.complaint_records TO anon, authenticated;

CREATE POLICY "Anyone can update complaint records"
  ON public.complaint_records
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);