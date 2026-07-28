import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/client'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type Language = 'ar' | 'en'

interface Translations {
  title: string
  subtitle: string
  newPasswordLabel: string
  newPasswordPlaceholder: string
  confirmPasswordLabel: string
  confirmPasswordPlaceholder: string
  showPassword: string
  hidePassword: string
  submitButton: string
  updating: string
  backToLogin: string
  successTitle: string
  successMessage: string
  errorTitle: string
}

const translations: Record<Language, Translations> = {
  ar: {
    title: 'إعادة تعيين كلمة المرور',
    subtitle: 'أدخل كلمة المرور الجديدة لحسابك',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: 'أدخل كلمة المرور الجديدة',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أدخل كلمة المرور مرة أخرى',
    showPassword: 'إظهار',
    hidePassword: 'إخفاء',
    submitButton: 'تحديث كلمة المرور',
    updating: 'جاري التحديث...',
    backToLogin: 'العودة لتسجيل الدخول',
    successTitle: 'تم التحديث',
    successMessage: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
    errorTitle: 'خطأ'
  },
  en: {
    title: 'Reset Password',
    subtitle: 'Enter a new password for your account',
    newPasswordLabel: 'New Password',
    newPasswordPlaceholder: 'Enter new password',
    confirmPasswordLabel: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter password again',
    showPassword: 'Show',
    hidePassword: 'Hide',
    submitButton: 'Update Password',
    updating: 'Updating...',
    backToLogin: 'Back to Login',
    successTitle: 'Updated',
    successMessage: 'Password updated successfully. You can now sign in with your new password',
    errorTitle: 'Error'
  }
}

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('ar')
  
  const navigate = useNavigate()
  const t = translations[language]
  const isRTL = language === 'ar'

  // Check if we're in a recovery session
  useEffect(() => {
    const checkRecovery = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      
      if (!accessToken) {
        // Not in recovery mode - could be an error or user navigated directly
        // We'll still allow the form but note that it requires a valid session
      }
    }
    checkRecovery()
  }, [])

  const validatePassword = (password: string): boolean => {
    // Minimum 8 characters
    if (password.length < 8) {
      return false
    }
    // At least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    return hasLetter && hasNumber
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate passwords
      if (!newPassword || !confirmPassword) {
        throw new Error(language === 'ar'
          ? 'يرجى إدخال كلمتي المرور'
          : 'Please enter both passwords')
      }

      if (newPassword !== confirmPassword) {
        throw new Error(language === 'ar'
          ? 'كلمات المرور غير متطابقة'
          : 'Passwords do not match')
      }

      if (!validatePassword(newPassword)) {
        throw new Error(language === 'ar'
          ? 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وحرف واحد ورقم واحد'
          : 'Password must be at least 8 characters with at least one letter and one number')
      }

      // Update password using Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        throw updateError
      }

      // Log the password update
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'password_updated',
            entity_type: 'auth',
            metadata: { timestamp: new Date().toISOString() }
          })
        }
      } catch {
        // Ignore audit log errors
      }

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/admin/login')
      }, 3000)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.errorTitle
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-navy-900 to-black py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Language Switcher */}
      <button
        onClick={() => setLanguage(prev => prev === 'ar' ? 'en' : 'ar')}
        className="absolute top-4 right-4 text-yellow-500 hover:text-yellow-400 transition-colors"
      >
        {language === 'ar' ? 'English' : 'العربية'}
      </button>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-500 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">DS</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-white">{t.title}</h2>
          <p className="mt-2 text-sm text-gray-400">{t.subtitle}</p>
        </div>

        {success ? (
          <div className="bg-green-900/50 border border-green-500 text-green-200 px-6 py-4 rounded-lg text-center">
            <h3 className="text-lg font-medium mb-2">{t.successTitle}</h3>
            <p className="text-sm">{t.successMessage}</p>
            <p className="mt-2 text-xs text-gray-400">
              {language === 'ar' ? 'جاري إعادة التوجيه...' : 'Redirecting...'}
            </p>
          </div>
        ) : (
          <form className="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl" onSubmit={handleSubmit}>
            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                {t.newPasswordLabel}
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  className={`appearance-none block w-full px-4 py-3 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t.newPasswordPlaceholder}
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
              <p className="mt-1 text-xs text-gray-400">
                {language === 'ar'
                  ? '8 أحرف على الأقل، مع حرف ورقم واحد'
                  : 'Minimum 8 characters with at least one letter and number'}
              </p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                {t.confirmPasswordLabel}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className={`appearance-none block w-full px-4 py-3 border border-gray-600 rounded-md placeholder-gray-400 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t.confirmPasswordPlaceholder}
              />
            </div>

            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? t.updating : t.submitButton}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
