import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/client'

type Language = 'ar' | 'en'

interface Translations {
  title: string
  subtitle: string
  emailLabel: string
  emailPlaceholder: string
  submitButton: string
  sending: string
  backToLogin: string
  successTitle: string
  successMessage: string
  errorTitle: string
}

const translations: Record<Language, Translations> = {
  ar: {
    title: 'نسيت كلمة المرور',
    subtitle: 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور',
    emailLabel: 'البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    submitButton: 'إرسال رابط إعادة التعيين',
    sending: 'جاري الإرسال...',
    backToLogin: 'العودة لتسجيل الدخول',
    successTitle: 'تم الإرسال',
    successMessage: 'تحقق من بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور',
    errorTitle: 'خطأ'
  },
  en: {
    title: 'Forgot Password',
    subtitle: 'Enter your email and we will send you a password reset link',
    emailLabel: 'Email',
    emailPlaceholder: 'Enter your email',
    submitButton: 'Send Reset Link',
    sending: 'Sending...',
    backToLogin: 'Back to Login',
    successTitle: 'Sent',
    successMessage: 'Check your email for the password reset link',
    errorTitle: 'Error'
  }
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [language, setLanguage] = useState<Language>('ar')
  
  const navigate = useNavigate()
  const t = translations[language]
  const isRTL = language === 'ar'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (!email) {
        throw new Error(language === 'ar' 
          ? 'يرجى إدخال البريد الإلكتروني' 
          : 'Please enter your email')
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`
      })

      if (resetError) {
        throw resetError
      }

      // Log the password reset request
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase.from('audit_logs').insert({
            user_id: user.id,
            action: 'password_reset_requested',
            entity_type: 'auth',
            metadata: { email, timestamp: new Date().toISOString() }
          })
        }
      } catch {
        // Ignore audit log errors
      }

      setSuccess(true)
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
            <Link
              to="/admin/login"
              className="mt-4 inline-block text-yellow-500 hover:text-yellow-400"
            >
              {t.backToLogin}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl" onSubmit={handleSubmit}>
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
              {loading ? t.sending : t.submitButton}
            </button>

            <div className="text-center">
              <Link
                to="/admin/login"
                className="text-sm text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                {t.backToLogin}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
