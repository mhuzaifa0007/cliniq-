
-- Allow patients to self-book appointments (where they are the patient)
CREATE POLICY "Patients can insert own appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
);
