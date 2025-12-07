import { useState, useEffect, useMemo, useRef } from 'react'
import {
  UserCog,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Grid3x3,
  List,
  CheckCircle2,
  UserPlus,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'

export default function Managers() {
  const { user, profile } = useAuth()
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('card')
  const [openActionsId, setOpenActionsId] = useState(null)
  const [selectedManager, setSelectedManager] = useState(null)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null)
  const actionMenuRefs = useRef({})

  useEffect(() => {
    if (user && profile?.role === 'owner') {
      loadManagers()
    }
  }, [user, profile])

  // Close menu when clicking outside (like ProductTable)
  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(actionMenuRefs.current).forEach((id) => {
        const ref = actionMenuRefs.current[id]
        if (ref && !ref.contains(event.target)) {
          if (openActionsId === id) {
            setOpenActionsId(null)
          }
        }
      })
    }

    const handleScroll = () => {
      setOpenActionsId(null)
      setMobileMenuOpen(null)
    }

    if (openActionsId || mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [openActionsId, mobileMenuOpen])

  const loadManagers = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Get all managers - in single company app, all managers belong to the owner's company
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('role', 'manager')
        .order('created_at', { ascending: false })

      if (error) throw error
      setManagers(data || [])
    } catch (error) {
      console.error('Error loading managers:', error)
      toast.error('Failed to load managers')
    } finally {
      setLoading(false)
    }
  }

  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) return managers
    
    const query = searchQuery.toLowerCase()
    return managers.filter(manager => 
      manager.username?.toLowerCase().includes(query) ||
      manager.business_name?.toLowerCase().includes(query) ||
      manager.phone_number?.toLowerCase().includes(query)
    )
  }, [managers, searchQuery])

  const handleRemove = async (managerId) => {
    if (!user) return
    
    setRemoving(true)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', managerId)
        .eq('role', 'manager')

      if (error) throw error
      
      toast.success('Manager removed successfully')
      setRemoveModalOpen(false)
      setSelectedManager(null)
      loadManagers()
    } catch (error) {
      console.error('Error removing manager:', error)
      toast.error('Failed to remove manager')
    } finally {
      setRemoving(false)
    }
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  if (profile?.role !== 'owner') {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500 dark:text-slate-400">You don't have permission to view this page.</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <UserCog className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Managers</h1>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search managers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-gray-100 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredManagers.length === 0 ? (
          <EmptyState
            icon={UserCog}
            title="No managers yet"
            description="Managers can be added through the Settings page"
          />
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredManagers.map((manager) => (
              <Card key={manager.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 dark:text-blue-400 font-semibold text-xl">
                          {manager.business_name?.[0]?.toUpperCase() ||
                            manager.username?.[0]?.toUpperCase() ||
                            'M'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-50 truncate">
                          {manager.business_name || manager.username || 'Manager'}
                        </h3>
                        {manager.username && (
                          <p className="text-sm text-gray-600 dark:text-slate-400 truncate">
                            @{manager.username}
                          </p>
                        )}
                        {manager.phone_number && (
                          <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                            {manager.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <div 
                      className="relative" 
                      ref={(el) => {
                        if (el) {
                          actionMenuRefs.current[manager.id] = el
                        } else {
                          delete actionMenuRefs.current[manager.id]
                        }
                      }}
                    >
                      {/* Desktop Dropdown */}
                      <div className="hidden md:block">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setOpenActionsId(openActionsId === manager.id ? null : manager.id)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          type="button"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        </button>
                        {openActionsId === manager.id && (
                          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setOpenActionsId(null)
                                setSelectedManager(manager)
                                setRemoveModalOpen(true)
                              }}
                              className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-lg transition-colors"
                              type="button"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                      {/* Mobile Button - Opens Bottom Sheet */}
                      <div className="md:hidden">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setMobileMenuOpen(mobileMenuOpen === manager.id ? null : manager.id)
                          }}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors touch-manipulation"
                          type="button"
                          aria-label="More options"
                          aria-expanded={mobileMenuOpen === manager.id}
                        >
                          <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                        </button>
                      </div>
                    </div>
                    {/* Floating Mobile Menu - Bottom Sheet */}
                    {mobileMenuOpen === manager.id && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
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
                              {manager.business_name || manager.username || 'Manager'}
                            </h3>
                            <div className="space-y-2">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  setTimeout(() => {
                                    setSelectedManager(manager)
                                    setRemoveModalOpen(true)
                                  }, 150)
                                }}
                                onTouchStart={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setMobileMenuOpen(null)
                                  setTimeout(() => {
                                    setSelectedManager(manager)
                                    setRemoveModalOpen(true)
                                  }, 150)
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 rounded-lg touch-manipulation transition-colors"
                                type="button"
                              >
                                <Trash2 className="w-5 h-5" />
                                <span className="font-medium">Remove Manager</span>
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

                  {/* Status */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      Active Manager
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Table View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Manager
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Username
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                  {filteredManagers.map((manager) => (
                    <tr
                      key={manager.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-blue-600 dark:text-blue-400 font-semibold">
                              {manager.business_name?.[0]?.toUpperCase() ||
                                manager.username?.[0]?.toUpperCase() ||
                                'M'}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 dark:text-slate-50">
                            {manager.business_name || manager.username || 'Manager'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-50">
                          @{manager.username || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-slate-50">
                          {manager.phone_number || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-sm text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-end gap-2">
                          {/* Desktop Actions */}
                          <div className="hidden md:block relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setOpenActionsId(openActionsId === manager.id ? null : manager.id)
                              }}
                              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                              type="button"
                              aria-label="More options"
                            >
                              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                            </button>
                            {openActionsId === manager.id && (
                              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setOpenActionsId(null)
                                    setSelectedManager(manager)
                                    setRemoveModalOpen(true)
                                  }}
                                  className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-lg transition-colors"
                                  type="button"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                          {/* Mobile Button */}
                          <div className="md:hidden">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setMobileMenuOpen(mobileMenuOpen === manager.id ? null : manager.id)
                              }}
                              className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation"
                              aria-label="More options"
                              aria-expanded={mobileMenuOpen === manager.id}
                              type="button"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Floating Mobile Menu - Bottom Sheet */}
                        {mobileMenuOpen === manager.id && (
                          <>
                            {/* Backdrop */}
                            <div
                              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
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
                                  {manager.business_name || manager.username || 'Manager'}
                                </h3>
                                <div className="space-y-2">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setMobileMenuOpen(null)
                                      setTimeout(() => {
                                        setSelectedManager(manager)
                                        setRemoveModalOpen(true)
                                      }, 150)
                                    }}
                                    onTouchStart={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setMobileMenuOpen(null)
                                      setTimeout(() => {
                                        setSelectedManager(manager)
                                        setRemoveModalOpen(true)
                                      }, 150)
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 rounded-lg touch-manipulation transition-colors"
                                    type="button"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                    <span className="font-medium">Remove Manager</span>
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
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Remove Confirmation Modal */}
      {removeModalOpen && selectedManager && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Remove Manager?
              </h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">
                Are you sure you want to remove {selectedManager.business_name || selectedManager.username}? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => {
                    setRemoveModalOpen(false)
                    setSelectedManager(null)
                  }}
                  disabled={removing}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleRemove(selectedManager.id)}
                  loading={removing}
                >
                  Remove
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}


