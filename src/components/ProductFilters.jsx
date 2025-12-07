import { useState } from 'react'
import { Search, X } from 'lucide-react'
import Input from './Input'
import Button from './Button'
import Card from './Card'

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Food', label: 'Food' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Beauty', label: 'Beauty' },
  { value: 'Other', label: 'Other' },
]

export default function ProductFilters({
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onClearFilters,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActiveFilters = searchQuery || (categoryFilter && categoryFilter !== 'all')

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    categoryFilter && categoryFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <Card className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            label="Search Products"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leadingIcon={Search}
            placeholder="Search by name..."
          />
        </div>

        {/* Category Filter */}
        <div className="md:w-48">
          <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="input-field"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={onClearFilters}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Active Filters Badge */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-purple-900/30 dark:text-purple-400">
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} active
          </span>
        </div>
      )}
    </Card>
  )
}

