import { useState } from 'react'
import { Search, X } from 'lucide-react'
import Input from './Input'
import Button from './Button'
import Card from './Card'
import { useProductCategories } from '../hooks/useProductCategories'

export default function ProductFilters({
  searchQuery,
  categoryFilter,
  onSearchChange,
  onCategoryChange,
  onClearFilters,
}) {
  const { categories, loading: categoriesLoading } = useProductCategories()
  const [isOpen, setIsOpen] = useState(false)
  const hasActiveFilters = searchQuery || (categoryFilter && categoryFilter !== 'all')
  
  // Build category options with "All Categories" first
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ]

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
          {categoriesLoading ? (
            <div className="input-field bg-gray-100 dark:bg-slate-700 animate-pulse text-gray-500 dark:text-slate-400">
              Loading...
            </div>
          ) : (
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="input-field"
              disabled={categoryOptions.length === 1}
            >
              {categoryOptions.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          )}
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

