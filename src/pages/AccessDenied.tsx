import { Link } from 'react-router-dom'

type Language = 'ar' | 'en'

interface Translations {
  title: string
  message: string
  description: string
  backToLogin: string
  contactSupport: string
}

const translations: Record<Language, Translations> = {
  ar: {
    title: 'تم رفض الوصول',
    message: 'ليس لديك صلاحيات للوصول إلى هذه الصفحة',
    description: 'هذه المنطقة مخصصة للمسؤولين فقط. إذا كنت تعتقد أنك يجب أن يكون لديك وصول، يرجى الاتصال بفريق الدعم.',
    backToLogin: 'العودة لتسجيل الدخول',
    contactSupport: 'اتصل بالدعم'
  },
  en: {
    title: 'Access Denied',
    message: 'You do not have permission to access this page',
    description: 'This area is restricted to administrators only. If you believe you should have access, please contact support.',
    backToLogin: 'Back to Login',
    contactSupport: 'Contact Support'
  }
}

export default function AccessDenied() {
  const language: Language = 'ar'
  const t = translations[language]
  const isRTL = language === 'ar'

  return (
    <div 
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-navy-900 to-black py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-md w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="mx-auto h-24 w-24 bg-red-500 rounded-full flex items-center justify-center">
          <svg
            className="h-12 w-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-3xl font-extrabold text-white">{t.title}</h2>
          <p className="mt-4 text-lg text-gray-300">{t.message}</p>
          <p className="mt-2 text-sm text-gray-400">{t.description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/admin/login"
            className="inline-flex justify-center py-3 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-900 bg-yellow-500 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 focus:ring-offset-gray-800 transition-all duration-200"
          >
            {t.backToLogin}
          </Link>
          <a
            href="mailto:support@digitalstore.com"
            className="inline-flex justify-center py-3 px-6 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 focus:ring-offset-gray-900 transition-all duration-200"
          >
            {t.contactSupport}
          </a>
        </div>
      </div>
    </div>
  )
}
