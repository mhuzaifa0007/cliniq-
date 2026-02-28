-- Add subscription plan column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text NOT NULL DEFAULT 'free';

-- Create RLS-safe function to get user's plan
CREATE OR REPLACE FUNCTION public.get_user_plan(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(subscription_plan, 'free') FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;