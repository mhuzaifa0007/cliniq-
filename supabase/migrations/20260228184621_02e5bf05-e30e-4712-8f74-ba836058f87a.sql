
-- Create a security definer function to get doctors list (bypasses RLS on user_roles)
CREATE OR REPLACE FUNCTION public.get_doctors()
RETURNS TABLE(user_id uuid, name text, phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.user_id, p.name, p.phone
  FROM public.profiles p
  INNER JOIN public.user_roles r ON r.user_id = p.user_id
  WHERE r.role = 'doctor'
  ORDER BY p.name
$$;
