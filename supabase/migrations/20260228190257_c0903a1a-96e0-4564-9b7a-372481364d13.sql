CREATE POLICY "Patients can create own patient profile"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());