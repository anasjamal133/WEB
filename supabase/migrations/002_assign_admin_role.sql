-- Migration: 002_assign_admin_role.sql
-- Purpose: Assign admin role to the admin user (run AFTER creating user in Supabase Auth)
-- 
-- IMPORTANT INSTRUCTIONS:
-- 1. First, create the admin user in Supabase Dashboard → Authentication → Users → Add User
-- 2. Use email: admin@digitalstore.com
-- 3. Set a secure password (do not use a weak password)
-- 4. Enable "Auto Confirm User" during initial testing (can be disabled later)
-- 5. Then run this migration in Supabase SQL Editor
--
-- This script is IDEMPOTENT - running it multiple times will not create duplicate roles

-- Find the admin user by email and assign the admin role
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Step 1: Find the user ID for admin@digitalstore.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@digitalstore.com';
  
  -- Step 2: Check if user exists
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email admin@digitalstore.com does not exist in auth.users. Please create the user first in Supabase Dashboard → Authentication → Users → Add User';
  END IF;
  
  -- Step 3: Insert or ignore the admin role (idempotent)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin'::public.user_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Step 4: Provide feedback
  RAISE NOTICE 'Admin role successfully assigned to admin@digitalstore.com (user_id: %)', admin_user_id;
END $$;

-- Optional: Log this action in audit_logs
INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, metadata)
SELECT 
  id,
  'admin_role_assigned',
  'user_role',
  id::text,
  jsonb_build_object('email', email, 'assigned_by', 'migration_script')
FROM auth.users
WHERE email = 'admin@digitalstore.com';
