export default function Input({
  label,
  error,
  helperText,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  className = '',
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        {LeadingIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
            <LeadingIcon className="w-5 h-5" />
          </div>
        )}
        <input
          className={`input-field ${LeadingIcon ? 'pl-10' : ''} ${TrailingIcon ? 'pr-10' : ''} ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 dark:focus:ring-red-400' : ''} ${className}`}
          {...props}
        />
        {TrailingIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-slate-500">
            <TrailingIcon className="w-5 h-5" />
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  )
}

