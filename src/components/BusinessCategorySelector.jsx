import { useState } from 'react'
import { Search, CheckCircle } from 'lucide-react'

const BUSINESS_CATEGORIES = [
  { 
    value: 'retail_general', 
    label: 'General Retail Store', 
    icon: '🏪',
    description: 'Mixed merchandise store'
  },
  { 
    value: 'grocery', 
    label: 'Grocery/Supermarket', 
    icon: '🛒',
    description: 'Food and household items'
  },
  { 
    value: 'pharmacy', 
    label: 'Pharmacy', 
    icon: '💊',
    description: 'Medical supplies and drugs'
  },
  { 
    value: 'electronics', 
    label: 'Electronics Store', 
    icon: '📱',
    description: 'Phones, computers, appliances'
  },
  { 
    value: 'clothing', 
    label: 'Clothing/Fashion', 
    icon: '👔',
    description: 'Apparel and accessories'
  },
  { 
    value: 'hardware', 
    label: 'Hardware Store', 
    icon: '🔨',
    description: 'Construction and tools'
  },
  { 
    value: 'beauty_salon', 
    label: 'Beauty Salon', 
    icon: '💄',
    description: 'Hair, cosmetics, salon services'
  },
  { 
    value: 'restaurant', 
    label: 'Restaurant/Café', 
    icon: '🍽️',
    description: 'Food service and dining'
  },
  { 
    value: 'mobile_money_agent', 
    label: 'Mobile Money Agent', 
    icon: '💳',
    description: 'Airtime, mobile money'
  },
  { 
    value: 'stationery', 
    label: 'Books/Stationery', 
    icon: '📚',
    description: 'Office and school supplies'
  },
  { 
    value: 'automotive', 
    label: 'Auto Parts/Garage', 
    icon: '🚗',
    description: 'Car parts and services'
  },
  { 
    value: 'agriculture', 
    label: 'Agricultural Supplies', 
    icon: '🌾',
    description: 'Farm supplies and equipment'
  }
]

export default function BusinessCategorySelector({ selected, onChange, error }) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredCategories = BUSINESS_CATEGORIES.filter(cat =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          What type of business do you operate? *
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search business type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
        {filteredCategories.map(category => (
          <button
            key={category.value}
            type="button"
            onClick={() => onChange(category.value)}
            className={`
              p-4 rounded-lg border-2 transition-all text-left
              hover:shadow-md hover:scale-[1.02]
              ${selected === category.value 
                ? 'border-blue-500 dark:border-purple-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' 
                : 'border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-purple-400 bg-white dark:bg-slate-800'
              }
            `}
          >
            <div className="text-4xl mb-2">{category.icon}</div>
            <div className="text-sm font-semibold mb-1 text-gray-900 dark:text-slate-50">
              {category.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
              {category.description}
            </div>
            
            {selected === category.value && (
              <div className="mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-blue-500 dark:text-purple-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-purple-400">
                  Selected
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-slate-400">
          No business types found matching "{searchQuery}"
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-2">
          {error}
        </p>
      )}
    </div>
  )
}
