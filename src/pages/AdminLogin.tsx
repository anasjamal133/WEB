import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/client'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type Language = 'ar' | 'en'

interface Translations {
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  passwordLabel: string
  passwordPlaceholder: string
  showPassword: string
  hidePassword: string
  forgotPassword: string
  signInButton: string
  signingIn: string
  errorTitle: string
  loadingTitle: string
}

const translations: Record<Language, Translations> = {
  ar: {
    title: 'تسجيل دخول الإدارة',
    subtitle: 'سجّل الدخول لإدارة متجر Digital Store',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    showPassword: 'إظهار',
    hidePassword: 'إخفاء',
    forgotPassword: 'نسيت كلمة المرور؟',
    signInButton: 'تسجيل الدخول',
    signingIn: 'جاري تسجيل الدخول...',
    errorTitle: 'خطأ',
    loadingTitle: 'جاري المعالجة...'
  },
  en: {
    title: 'Admin Login',
    subtitle: 'Sign in to manage Digital Store',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    showPassword: 'Show',
    hidePassword: 'Hide',
    forgotPassword: 'Forgot password?',
    signInButton: 'Sign In',
    signingIn: 'Signing in...',
    errorTitle: 'Error',
    loadingTitle: 'Processing...'
  }
}

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('ar')
  
  const navigate = useNavigate()
  const location = useLocation()
  
  const t = translations[language]
  const isRTL = language === 'ar'

  // Check if already logged in on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Verify admin role
        const { data: isAdmin } = await supabase.rpc('is_admin')
        if (isAdmin === true) {
          navigate('/dashboard', { replace: true })
        } else {
          navigate('/admin/access-denied', { replace: true })
        }
      }
    }
    checkSession()
  }, [navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate inputs
      if (!email || !password) {
        throw new Error(language === 'ar' 
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
          : 'Please enter email and password')
      }

      // Attempt sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        // Handle different error types
        if (signInError.message.includes('Invalid login credentials')) {
          throw new Error(language === 'ar'
            ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
            : 'Invalid email or password')
        }
        if (signInError.message.includes('Email not confirmed')) {
          throw new Error(language === 'ar'
            ? 'لم يتم تأكيد البريد الإلكتروني بعد'
            : 'Email not confirmed')
        }
        throw signInError
      }

      // Verify admin role
      const { data: roleData, error: roleError } = await supabase.rpc('is_admin')
      
      if (roleError) {
        throw new Error(language === 'ar'
          ? 'حدث خطأ أثناء التحقق من الصلاحيات'
          : 'Error verifying permissions')
      }

      if (roleData !== true) {
        // Not an admin - sign out and redirect
        await supabase.auth.signOut()
        throw new Error(language === 'ar'
          ? 'ليس لديك صلاحيات الوصول للإدارة'
          : 'You do not have admin access permissions')
      }

      // Log successful admin login
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        action: 'admin_login',
        entity_type: 'auth',
        metadata: { email: data.user.email, timestamp: new Date().toISOString() }
      })

      // Get the return URL if exists
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (t.errorTitle)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-navy-900 to-black py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Switcher */}
      <button
        onClick={toggleLanguage}
        className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-400 transition-colors"
        aria-label="Switch language"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">DS</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">
            {t.title}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {t.subtitle}
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl" onSubmit={handleLogin}>
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              {t.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`appearance-none block w-full px-4 py-3 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}
              placeholder={t.emailPlaceholder}
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className={`appearance-none block w-full px-4 py-3 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.passwordPlaceholder}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                aria-label={showPassword ? t.hidePassword : t.showPassword}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              to="/admin/forgot-password"
              className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
            >
              {t.forgotPassword}
            </Link>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? t.signingIn : t.signInButton}
          </button>
        </form>
      </div>
    </div>
  )
}
