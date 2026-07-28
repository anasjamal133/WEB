import { Navigate, useLocation } from 'react-router-dom'
import { useRequireAdmin } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authorized, checking, user } = useRequireAdmin()
  const location = useLocation()

  // Still checking auth status - show loading or nothing
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-white">جاري التحقق...</p>
          <p className="text-gray-400">Verifying...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login with return URL
  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  // Authenticated but not admin - redirect to access denied
  if (!authorized) {
    return <Navigate to="/admin/access-denied" replace />
  }

  // Authorized admin - render children
  return <>{children}</>
}
