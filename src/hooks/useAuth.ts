import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase } from '../lib/client'
import type { Database } from '../lib/types'

type UserRole = Database['public']['Enums']['user_role']

interface AuthContextType {
  user: User | null
  session: Session | null
  role: UserRole | null
  loading: boolean
  isAdmin: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  checkAdminRole: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if user has admin role
  const checkAdminRole = useCallback(async (): Promise<boolean> => {
    if (!user) {
      setRole(null)
      return false
    }

    try {
      // Use the secure is_admin() function from Supabase
      const { data, error } = await supabase.rpc('is_admin')
      
      if (error) {
        console.error('Error checking admin role:', error)
        setRole(null)
        return false
      }

      const isAdmin = data === true
      setRole(isAdmin ? 'admin' : 'customer')
      return isAdmin
    } catch (err) {
      console.error('Error in checkAdminRole:', err)
      setRole(null)
      return false
    }
  }, [user])

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession()
      
      if (error) throw error
      
      setSession(newSession)
      setUser(newSession?.user ?? null)
      
      if (newSession?.user) {
        await checkAdminRole()
      } else {
        setRole(null)
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setSession(null)
      setUser(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [checkAdminRole])

  // Initial session load and auth state changes
  useEffect(() => {
    let mounted = true

    // Get initial session
    refreshSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!mounted) return
        
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          await checkAdminRole()
        } else {
          setRole(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshSession, checkAdminRole])

  const value: AuthContextType = {
    user,
    session,
    role,
    loading,
    isAdmin: role === 'admin',
    isAuthenticated: !!user,
    refreshSession,
    checkAdminRole
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook specifically for admin access control
export function useRequireAdmin() {
  const { user, isAdmin, loading, refreshSession } = useAuth()
  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    const verifyAdmin = async () => {
      if (loading) {
        setChecking(true)
        return
      }

      if (!user) {
        setAuthorized(false)
        setChecking(false)
        return
      }

      // Double-check admin status with fresh RPC call
      try {
        const { data: isAdminResult } = await supabase.rpc('is_admin')
        if (mounted) {
          setAuthorized(isAdminResult === true)
          setChecking(false)
        }
      } catch {
        if (mounted) {
          setAuthorized(false)
          setChecking(false)
        }
      }
    }

    verifyAdmin()

    return () => {
      mounted = false
    }
  }, [user, isAdmin, loading])

  return { authorized, checking, user, isAdmin, refreshSession }
}
