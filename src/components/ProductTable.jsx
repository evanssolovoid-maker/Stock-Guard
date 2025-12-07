import { useState, useEffect, useRef } from 'react'
import { Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical } from 'lucide-react'
import Button from './Button'

export default function ProductTable({ products, onEdit, onDelete, isOwner = true }) {
  const [sortField, setSortField] = useState('created_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null)
  const menuRef = useRef(null)

  // Close menu when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMobileMenuOpen(null)
      }
    }

    const handleScroll = () => {
      setMobileMenuOpen(null)
    }

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [mobileMenuOpen])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedProducts = [...products].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]

    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  const getQuantityColor = (quantity) => {
    if (quantity >= 10) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (quantity >= 5) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-blue-500 dark:text-purple-500" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-500 dark:text-purple-500" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-slate-700">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
              Image
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Name
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => handleSort('price')}
            >
              <div className="flex items-center gap-2">
                Price
                <SortIcon field="price" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              onClick={() => handleSort('quantity')}
            >
              <div className="flex items-center gap-2">
                Quantity
                <SortIcon field="quantity" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
              Category
            </th>
            {isOwner && (
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-slate-300">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product, index) => (
            <tr
              key={product.id}
              className={`border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-gray-50/50 dark:bg-slate-800/50'
              }`}
            >
              <td className="py-3 px-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-500 text-xs">
                      No img
                    </div>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-slate-50">
                    {product.name}
                  </span>
                  {product.quantity < 10 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Low Stock
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <span className="font-semibold text-blue-500 dark:text-purple-500">
                  UGX {Number(product.price).toLocaleString()}
                </span>
              </td>
              <td className="py-3 px-4">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getQuantityColor(
                    product.quantity
                  )}`}
                >
                  {product.quantity}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className="text-sm text-gray-600 dark:text-slate-400 capitalize">
                  {product.category || 'Uncategorized'}
                </span>
              </td>
              {isOwner && (
                <td className="py-3 px-4">
                  <div className="flex items-center justify-end gap-2">
                    {/* Desktop Actions */}
                    <div className="hidden md:flex gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-blue-500 dark:text-purple-500 hover:bg-blue-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        aria-label="Edit product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Mobile Actions */}
                    <div className="relative md:hidden" ref={menuRef}>
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setMobileMenuOpen(
                            mobileMenuOpen === product.id ? null : product.id
                          )
                        }}
                        className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation"
                        aria-label="More options"
                        aria-expanded={mobileMenuOpen === product.id}
                        type="button"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Floating Mobile Menu - Fixed Position */}
                    {mobileMenuOpen === product.id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMobileMenuOpen(null)
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMobileMenuOpen(null)
                          }}
                        />
                        {/* Floating Menu */}
                        <div 
                          className="fixed bottom-0 left-0 right-0 md:hidden bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 rounded-t-2xl shadow-2xl z-50 animate-slide-up"
                          onClick={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                        >
                          <div className="p-4">
                            <div className="w-12 h-1 bg-gray-300 dark:bg-slate-600 rounded-full mx-auto mb-4" />
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 px-2">
                              {product.name}
                            </h3>
                            <div className="space-y-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  // Small delay to ensure menu closes before modal opens
                                  setTimeout(() => onEdit(product), 150)
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  setTimeout(() => onEdit(product), 150)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-base text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation transition-colors"
                                type="button"
                              >
                                <Edit className="w-5 h-5 text-blue-500 dark:text-purple-500" />
                                <span className="font-medium">Edit Product</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  // Small delay to ensure menu closes before modal opens
                                  setTimeout(() => onDelete(product), 150)
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  setTimeout(() => onDelete(product), 150)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 rounded-lg touch-manipulation transition-colors"
                                type="button"
                              >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">Delete Product</span>
                              </button>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMobileMenuOpen(null)
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMobileMenuOpen(null)
                              }}
                              className="w-full mt-4 px-4 py-3 text-base font-medium text-gray-600 dark:text-slate-400 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 active:bg-gray-300 dark:active:bg-slate-500 rounded-lg touch-manipulation transition-colors"
                              type="button"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

