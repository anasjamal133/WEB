-- Migration: 001_create_user_role_enum_and_tables.sql
-- Purpose: Create secure role-based access control system for Digital Store admin

-- Step 1: Create the user_role enum type
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'staff', 'customer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.user_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Foreign key constraint referencing auth.users with cascade delete
  CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate roles per user
  CONSTRAINT user_roles_user_id_role_unique 
    UNIQUE (user_id, role)
);

-- Step 3: Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- Step 4: Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Create index on audit_logs for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Step 6: Enable Row Level Security on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Step 7: Enable Row Level Security on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 8: Create secure has_role function
-- This function checks if the current authenticated user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role public.user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_has_role BOOLEAN;
BEGIN
  -- Check if the authenticated user has the required role
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = required_role
  ) INTO user_has_role;
  
  RETURN user_has_role;
END;
$$;

-- Step 9: Create is_admin convenience function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN public.has_role('admin'::public.user_role);
END;
$$;

-- Step 10: Revoke execute permissions from public, grant only to authenticated users
REVOKE ALL ON FUNCTION public.has_role(public.user_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(public.user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Step 11: Create RLS policies for user_roles table

-- Policy: Allow authenticated users to view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Only admins can view all user roles
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Prevent any user from inserting roles themselves (must be done via SQL Editor or server-side)
-- No INSERT policy means no one can insert through regular queries

-- Policy: Prevent any user from updating roles
-- No UPDATE policy means no one can update through regular queries

-- Policy: Prevent any user from deleting roles
-- No DELETE policy means no one can delete through regular queries

-- Step 12: Create RLS policies for audit_logs table

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy: Insert audit logs - allow authenticated users to create log entries
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Prevent updates and deletes on audit logs (immutable records)
-- No UPDATE or DELETE policies

-- Step 13: Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT INSERT ON public.audit_logs TO authenticated;

-- Step 14: Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.user_roles IS 'Stores user role assignments for access control';
COMMENT ON TABLE public.audit_logs IS 'Audit trail for admin and system actions';
COMMENT ON FUNCTION public.has_role IS 'Check if current user has a specific role';
COMMENT ON FUNCTION public.is_admin IS 'Check if current user is an admin';
