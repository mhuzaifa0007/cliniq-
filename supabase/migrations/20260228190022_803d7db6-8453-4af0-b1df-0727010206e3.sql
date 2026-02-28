
-- Insert 4 doctor users into auth.users (the handle_new_user trigger will create profiles and roles)
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud, created_at, updated_at)
VALUES
  ('a1b2c3d4-1111-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'huzaifa@hamzaclinic.pk', crypt('Doctor123!', gen_salt('bf')), now(), '{"name":"M. Huzaifa","role":"doctor"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  ('a1b2c3d4-2222-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'drhamza@hamzaclinic.pk', crypt('Doctor123!', gen_salt('bf')), now(), '{"name":"Dr. Hamza","role":"doctor"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  ('a1b2c3d4-3333-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'syedhuzaifa@hamzaclinic.pk', crypt('Doctor123!', gen_salt('bf')), now(), '{"name":"Syed Huzaifa","role":"doctor"}'::jsonb, 'authenticated', 'authenticated', now(), now()),
  ('a1b2c3d4-4444-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'drnoor@hamzaclinic.pk', crypt('Doctor123!', gen_salt('bf')), now(), '{"name":"Dr. Noor","role":"doctor"}'::jsonb, 'authenticated', 'authenticated', now(), now());

-- Create identities for each user
INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'a1b2c3d4-1111-4000-8000-000000000001', 'a1b2c3d4-1111-4000-8000-000000000001', '{"sub":"a1b2c3d4-1111-4000-8000-000000000001","email":"huzaifa@hamzaclinic.pk"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-2222-4000-8000-000000000002', 'a1b2c3d4-2222-4000-8000-000000000002', '{"sub":"a1b2c3d4-2222-4000-8000-000000000002","email":"drhamza@hamzaclinic.pk"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-3333-4000-8000-000000000003', 'a1b2c3d4-3333-4000-8000-000000000003', '{"sub":"a1b2c3d4-3333-4000-8000-000000000003","email":"syedhuzaifa@hamzaclinic.pk"}'::jsonb, 'email', now(), now(), now()),
  (gen_random_uuid(), 'a1b2c3d4-4444-4000-8000-000000000004', 'a1b2c3d4-4444-4000-8000-000000000004', '{"sub":"a1b2c3d4-4444-4000-8000-000000000004","email":"drnoor@hamzaclinic.pk"}'::jsonb, 'email', now(), now(), now());
