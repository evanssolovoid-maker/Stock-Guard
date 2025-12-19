import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import ThemeToggle from './ThemeToggle'
import { Menu, ChevronDown } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function DashboardLayout({ children, title }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const location = useLocation()
  const { profile, user } = useAuth()

  // Get page title from route
  const getPageTitle = () => {
    if (title) return title
    const path = location.pathname
    const titles = {
      '/dashboard': 'Dashboard',
      '/products': 'Products',
      '/sales': 'Sales',
      '/workers': 'Workers',
      '/analytics': 'Analytics',
      '/settings': 'Settings',
      '/log-sale': 'Log Sale',
      '/my-sales': 'My Sales',
    }
    return titles[path] || 'StockGuard'
  }

  return (
    <div className="flex h-screen bg-white dark:bg-slate-900 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-slate-400" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-slate-50">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="relative">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 dark:bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {profile?.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600 dark:text-slate-400" />
              </button>

              {profileMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setProfileMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 sm:w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                    <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-50 truncate">
                        {profile?.username || user?.username || 'User'}
                      </p>
                      {profile?.business_name && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                          {profile.business_name}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

