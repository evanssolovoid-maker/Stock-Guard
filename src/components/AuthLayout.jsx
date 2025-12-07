import { useState } from 'react'
import ThemeToggle from './ThemeToggle'

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto pt-20 sm:pt-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-50">
              StockGuard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
              {subtitle || 'Inventory & Sales Tracking'}
            </p>
          </div>
          <div className="card py-8 px-6 sm:px-10">
            {title && (
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 mb-6 text-center">
                {title}
              </h2>
            )}
            {children}
          </div>
        </div>
      </div>

      {/* Right Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-center lg:px-8 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-purple-600 dark:to-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 text-white px-8">
          <h2 className="text-4xl font-bold mb-4">
            Manage Your Business Inventory
          </h2>
          <p className="text-xl mb-8 text-blue-100 dark:text-purple-100">
            Track sales, manage stock, and grow your business with confidence.
          </p>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Real-time Inventory Tracking</h3>
                <p className="text-blue-100 dark:text-purple-100 text-sm">Monitor stock levels instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Sales Analytics</h3>
                <p className="text-blue-100 dark:text-purple-100 text-sm">Make data-driven decisions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Multi-user Support</h3>
                <p className="text-blue-100 dark:text-purple-100 text-sm">Work with your team seamlessly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

