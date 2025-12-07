import { Grid3x3, List } from 'lucide-react'

export default function ViewToggle({ viewMode, onViewChange }) {
  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
      <button
        onClick={() => onViewChange('grid')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'grid'
            ? 'bg-blue-500 dark:bg-purple-500 text-white'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
        }`}
        aria-label="Grid view"
      >
        <Grid3x3 className="w-5 h-5" />
      </button>
      <button
        onClick={() => onViewChange('table')}
        className={`p-2 rounded transition-colors ${
          viewMode === 'table'
            ? 'bg-blue-500 dark:bg-purple-500 text-white'
            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600'
        }`}
        aria-label="Table view"
      >
        <List className="w-5 h-5" />
      </button>
    </div>
  )
}

