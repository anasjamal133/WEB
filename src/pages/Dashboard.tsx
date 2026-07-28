import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/client'
import { useAuth } from '../../hooks/useAuth'

type Language = 'ar' | 'en'

interface Translations {
  title: string
  welcome: string
  subtitle: string
  logoutButton: string
  loggingOut: string
}

const translations: Record<Language, Translations> = {
  ar: {
    title: 'لوحة التحكم',
    welcome: 'مرحباً',
    subtitle: 'إدارة متجر Digital Store',
    logoutButton: 'تسجيل الخروج',
    loggingOut: 'جاري تسجيل الخروج...'
  },
  en: {
    title: 'Dashboard',
    welcome: 'Welcome',
    subtitle: 'Manage Digital Store',
    logoutButton: 'Sign Out',
    loggingOut: 'Signing out...'
  }
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('ar')
  
  const navigate = useNavigate()
  const t = translations[language]
  const isRTL = language === 'ar'

  const handleLogout = async () => {
    setLoading(true)
    
    try {
      // Log the logout action before signing out
      if (user) {
        try {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'admin_logout',
            entity_type: 'auth',
            metadata: { email: user.email, timestamp: new Date().toISOString() }
          })
        } catch {
          // Ignore audit log errors
        }
      }

      // Sign out
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('Logout error:', error)
      }
      
      // Redirect to login
      navigate('/admin/login', { replace: true })
    } catch (err) {
      console.error('Unexpected logout error:', err)
      navigate('/admin/login', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-navy-900 to-black ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">DS</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t.title}</h1>
                <p className="text-sm text-gray-400">{t.subtitle}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <button
                onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
                className="text-yellow-500 hover:text-yellow-400 transition-colors text-sm"
              >
                {language === 'ar' ? 'English' : 'العربية'}
              </button>
              
              {/* User Info */}
              {user && (
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-white">{user.email}</p>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              )}
              
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={loading}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t.loggingOut : t.logoutButton}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 rounded-lg shadow-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {t.welcome}, {user?.email?.split('@')[0] || 'Admin'}!
          </h2>
          <p className="text-gray-400 mb-6">
            {language === 'ar' 
              ? 'تم تسجيل دخولك بنجاح. هذه هي لوحة تحكم الإدارة.' 
              : 'You are successfully logged in. This is the admin dashboard.'}
          </p>
          
          {/* Dashboard Stats Placeholder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'الطلبات' : 'Orders'}
              </h3>
              <p className="text-3xl font-bold text-yellow-500">0</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'العملاء' : 'Customers'}
              </h3>
              <p className="text-3xl font-bold text-yellow-500">0</p>
            </div>
            <div className="bg-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-2">
                {language === 'ar' ? 'الإيرادات' : 'Revenue'}
              </h3>
              <p className="text-3xl font-bold text-yellow-500">$0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
