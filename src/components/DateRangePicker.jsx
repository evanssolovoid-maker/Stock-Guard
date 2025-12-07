import { useState } from 'react'
import { Calendar, X } from 'lucide-react'
import { Popover, Transition } from '@headlessui/react'

export default function DateRangePicker({ value, onChange, className = '' }) {
  const [startDate, setStartDate] = useState(value?.startDate || '')
  const [endDate, setEndDate] = useState(value?.endDate || '')

  const quickOptions = [
    { label: 'Today', days: 0 },
    { label: 'Last 7 days', days: -7 },
    { label: 'Last 30 days', days: -30 },
    { label: 'This Month', custom: true },
  ]

  const handleQuickSelect = (option) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (option.custom) {
      // This Month
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      onChange({
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      })
    } else {
      const start = new Date(today)
      start.setDate(start.getDate() + option.days)
      onChange({
        startDate: start.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0],
      })
    }
  }

  const handleApply = () => {
    if (startDate && endDate) {
      onChange({ startDate, endDate })
    }
  }

  const handleClear = () => {
    setStartDate('')
    setEndDate('')
    onChange(null)
  }

  const formatDateRange = () => {
    if (!value?.startDate || !value?.endDate) return 'Select date range'
    const start = new Date(value.startDate).toLocaleDateString()
    const end = new Date(value.endDate).toLocaleDateString()
    return `${start} - ${end}`
  }

  return (
    <Popover className={`relative ${className}`}>
      {({ open, close }) => (
        <>
          <Popover.Button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">{formatDateRange()}</span>
          </Popover.Button>

          <Transition
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute z-50 mt-2 w-80 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                    Select Date Range
                  </h3>
                  <button
                    onClick={close}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Select */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {quickOptions.map((option) => (
                    <button
                      key={option.label}
                      onClick={() => {
                        handleQuickSelect(option)
                        close()
                      }}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-slate-300 transition-colors"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                {/* Custom Range */}
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleApply()
                      close()
                    }}
                    disabled={!startDate || !endDate}
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      handleClear()
                      close()
                    }}
                    className="px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 font-medium text-sm transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}

