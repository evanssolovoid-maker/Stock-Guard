export default function Card({
  children,
  header,
  footer,
  hover = false,
  className = '',
  ...props
}) {
  return (
    <div
      className={`card ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''} ${className}`}
      {...props}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          {header}
        </div>
      )}
      <div className={header || footer ? 'px-6 py-4' : 'p-6'}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
          {footer}
        </div>
      )}
    </div>
  )
}

