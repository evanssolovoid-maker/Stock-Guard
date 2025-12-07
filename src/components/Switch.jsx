import { forwardRef } from 'react'

const Switch = forwardRef(
  ({ checked, onChange, disabled = false, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (!disabled && onChange) {
            onChange(!checked)
          }
        }}
        className={`${
          checked
            ? 'bg-blue-500 dark:bg-purple-500'
            : 'bg-gray-200 dark:bg-slate-700'
        } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          className || ''
        }`}
        {...props}
      >
        <span
          className={`${
            checked ? 'translate-x-6' : 'translate-x-1'
          } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
        />
      </button>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch

