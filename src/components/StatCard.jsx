export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  className = '',
}) {
  const colorClasses = {
    blue: {
      icon: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      gradient: 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10',
      text: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      icon: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      gradient: 'from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10',
      text: 'text-emerald-600 dark:text-emerald-400',
    },
    purple: {
      icon: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      gradient: 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10',
      text: 'text-purple-600 dark:text-purple-400',
    },
    orange: {
      icon: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      gradient: 'from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10',
      text: 'text-amber-600 dark:text-amber-400',
    },
    red: {
      icon: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      gradient: 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10',
      text: 'text-red-600 dark:text-red-400',
    },
  }

  const colors = colorClasses[color] || colorClasses.blue

  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700
        bg-gradient-to-br ${colors.gradient}
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}
        ${className}
      `}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              {title}
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-50 leading-tight">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`p-3 rounded-xl ${colors.icon} flex-shrink-0 ml-4`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
        {trend && (
          <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200/50 dark:border-slate-700/50">
            {trend.direction === 'up' ? (
              <svg
                className="w-4 h-4 text-emerald-600 dark:text-emerald-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            ) : trend.direction === 'down' ? (
              <svg
                className="w-4 h-4 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                />
              </svg>
            ) : null}
            {trend.value && (
              <span
                className={`text-xs font-semibold ${
                  trend.direction === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : trend.direction === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-600 dark:text-slate-400'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

