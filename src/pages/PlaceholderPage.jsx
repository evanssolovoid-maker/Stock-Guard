import DashboardLayout from '../components/DashboardLayout'

export default function PlaceholderPage({ title }) {
  return (
    <DashboardLayout>
      <div className="card p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 mb-4">
          {title || 'Coming Soon'}
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          This page is under development.
        </p>
      </div>
    </DashboardLayout>
  )
}

