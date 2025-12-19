import { useState, useEffect } from 'react'
import { Search, Building2, CheckCircle, X } from 'lucide-react'
import { supabase } from '../services/supabase'
import { useDebounce } from '../hooks/useDebounce'

export default function BusinessSelector({ onSelect, selectedBusiness, error, placeholder = "Search for your company..." }) {
  const [businesses, setBusinesses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      loadBusinesses()
    } else {
      setBusinesses([])
    }
  }, [debouncedSearchQuery])

  const loadBusinesses = async () => {
    setLoading(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('business_name')
        .eq('role', 'owner')
        .ilike('business_name', `%${debouncedSearchQuery.trim()}%`)
        .order('business_name')
        .limit(10)

      if (fetchError) throw fetchError

      setBusinesses(data || [])
    } catch (err) {
      console.error('Error loading businesses:', err)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
        Select Business/Company *
      </label>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-slate-500" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-50 focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {selectedBusiness && (
        <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              <span className="text-sm text-gray-700 dark:text-slate-300">
                Selected: <strong className="text-green-700 dark:text-green-400">{selectedBusiness}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                onSelect(null)
                setSearchQuery('')
              }}
              className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {!selectedBusiness && debouncedSearchQuery.trim().length >= 2 && (
        <div className="mt-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 max-h-48 overflow-y-auto shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
              Searching...
            </div>
          ) : businesses.length > 0 ? (
            businesses.map((business) => (
              <button
                key={business.business_name}
                type="button"
                onClick={() => {
                  onSelect(business.business_name)
                  setSearchQuery(business.business_name)
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700 last:border-b-0 flex items-center gap-2"
              >
                <Building2 className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                <span className="text-sm text-gray-900 dark:text-slate-50">
                  {business.business_name}
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-gray-500 dark:text-slate-400">
              No businesses found matching "{debouncedSearchQuery}"
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
      
      {!selectedBusiness && searchQuery.trim().length < 2 && (
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Type at least 2 characters to search for your company
        </p>
      )}
    </div>
  )
}
