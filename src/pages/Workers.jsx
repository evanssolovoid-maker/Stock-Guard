import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Users,
  Search,
  MoreVertical,
  Eye,
  Trash2,
  Grid3x3,
  List,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import Button from '../components/Button'
import EmptyState from '../components/EmptyState'
import WorkerPerformanceModal from '../components/WorkerPerformanceModal'
import RemoveWorkerConfirmation from '../components/RemoveWorkerConfirmation'
import { useAuth } from '../hooks/useAuth'
import { useWorkersStore } from '../store/workersStore'
import { toast } from 'react-hot-toast'

export default function Workers() {
  const { user } = useAuth()
  const {
    workers,
    loading,
    error,
    searchQuery,
    viewMode,
    loadWorkers,
    removeWorker,
    setSearchQuery,
    setViewMode,
    getFilteredWorkers,
  } = useWorkersStore()

  const [performanceModalOpen, setPerformanceModalOpen] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [removing, setRemoving] = useState(false)
  const [openActionsId, setOpenActionsId] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(null)
  const actionMenuRefs = useRef({})

  useEffect(() => {
    if (user) {
      loadWorkers(user.id)
    }
  }, [user, loadWorkers])

  // Listen for worker creation events from Settings page
  useEffect(() => {
    const handleWorkerCreated = () => {
      if (user) {
        loadWorkers(user.id)
      }
    }
    
    window.addEventListener('workerCreated', handleWorkerCreated)
    return () => {
      window.removeEventListener('workerCreated', handleWorkerCreated)
    }
  }, [user, loadWorkers])

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

  const filteredWorkers = useMemo(() => getFilteredWorkers(), [workers, searchQuery, getFilteredWorkers])

  const handleViewPerformance = (worker) => {
    setSelectedWorker(worker)
    setPerformanceModalOpen(true)
  }

  const handleRemoveClick = (worker) => {
    setSelectedWorker(worker)
    setRemoveModalOpen(true)
  }

  const handleRemoveConfirm = async () => {
    if (!selectedWorker || !user) return

    setRemoving(true)
    try {
      const workerId = selectedWorker.worker?.id || selectedWorker.id
      await removeWorker(user.id, workerId)
      setRemoveModalOpen(false)
      setSelectedWorker(null)
    } catch (error) {
      // Error already handled in store
    } finally {
      setRemoving(false)
    }
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Team Management</h1>
          </div>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search workers..."
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
        ) : filteredWorkers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No workers yet"
            description="Workers can be added through the Settings page"
          />
        ) : viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkers.map((bw) => {
              const worker = bw.worker
              const stats = worker.stats || { salesToday: 0, totalSales: 0, totalRevenue: 0 }

              return (
                <Card key={bw.id} className="p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 dark:text-blue-400 font-semibold text-xl">
                            {worker.business_name?.[0]?.toUpperCase() ||
                              worker.username?.[0]?.toUpperCase() ||
                              'W'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-slate-50 truncate mb-1">
                            {worker.business_name || 'Worker'}
                          </h3>
                          {worker.username && (
                            <p className="text-sm text-gray-600 dark:text-slate-400 truncate mb-1">
                              @{worker.username}
                            </p>
                          )}
                          {worker.phone_number && (
                            <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                              {worker.phone_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div 
                        className="relative" 
                        ref={(el) => {
                          if (el) {
                            actionMenuRefs.current[bw.id] = el
                          } else {
                            delete actionMenuRefs.current[bw.id]
                          }
                        }}
                      >
                        {/* Desktop Dropdown */}
                        <div className="hidden md:block">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setOpenActionsId(openActionsId === bw.id ? null : bw.id)
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                            type="button"
                            aria-label="More options"
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                          </button>
                          {openActionsId === bw.id && (
                            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenActionsId(null)
                                  handleViewPerformance(bw)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-lg transition-colors"
                                type="button"
                              >
                                <Eye className="w-4 h-4" />
                                View Performance
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  setOpenActionsId(null)
                                  handleRemoveClick(bw)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg transition-colors"
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
                              setMobileMenuOpen(mobileMenuOpen === bw.id ? null : bw.id)
                            }}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 transition-colors touch-manipulation"
                            type="button"
                            aria-label="More options"
                            aria-expanded={mobileMenuOpen === bw.id}
                          >
                            <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                          </button>
                        </div>
                      </div>
                      {/* Floating Mobile Menu - Bottom Sheet */}
                      {mobileMenuOpen === bw.id && (
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
                                {worker.business_name || worker.username || 'Worker'}
                              </h3>
                              <div className="space-y-2">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMobileMenuOpen(null)
                                    setTimeout(() => handleViewPerformance(bw), 150)
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMobileMenuOpen(null)
                                    setTimeout(() => handleViewPerformance(bw), 150)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation transition-colors"
                                  type="button"
                                >
                                  <Eye className="w-5 h-5 text-blue-500 dark:text-purple-500" />
                                  <span className="font-medium">View Performance</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMobileMenuOpen(null)
                                    setTimeout(() => handleRemoveClick(bw), 150)
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setMobileMenuOpen(null)
                                    setTimeout(() => handleRemoveClick(bw), 150)
                                  }}
                                  className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 rounded-lg touch-manipulation transition-colors"
                                  type="button"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  <span className="font-medium">Remove Worker</span>
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

                    {/* Stats */}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 dark:text-slate-400">Sales Today</p>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {stats.salesToday}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-600 dark:text-slate-400">Total Sales</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-slate-50">
                          {stats.totalSales}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Worker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Sales Today
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Revenue
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
                  {filteredWorkers.map((bw) => {
                    const worker = bw.worker
                    const stats = worker.stats || { salesToday: 0, totalSales: 0, totalRevenue: 0 }

                    return (
                      <tr
                        key={bw.id}
                        className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                {worker.business_name?.[0]?.toUpperCase() ||
                                  worker.username?.[0]?.toUpperCase() ||
                                  'W'}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900 dark:text-slate-50">
                                {worker.business_name || 'Worker'}
                              </span>
                              {worker.username && (
                                <span className="text-xs text-gray-500 dark:text-slate-400">
                                  @{worker.username}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-slate-50">
                            {worker.phone_number || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 text-sm font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            {stats.salesToday}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900 dark:text-slate-50">
                          {stats.totalSales}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(stats.totalRevenue)}
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
                                  setOpenActionsId(openActionsId === bw.id ? null : bw.id)
                                }}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                type="button"
                                aria-label="More options"
                              >
                                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-slate-400" />
                              </button>
                              {openActionsId === bw.id && (
                                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setOpenActionsId(null)
                                      handleViewPerformance(bw)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2 rounded-t-lg transition-colors"
                                    type="button"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Performance
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      setOpenActionsId(null)
                                      handleRemoveClick(bw)
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg transition-colors"
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
                                  setMobileMenuOpen(mobileMenuOpen === bw.id ? null : bw.id)
                                }}
                                className="p-2 text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation"
                                aria-label="More options"
                                aria-expanded={mobileMenuOpen === bw.id}
                                type="button"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          {/* Floating Mobile Menu - Bottom Sheet */}
                          {mobileMenuOpen === bw.id && (
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
                                    {worker.business_name || worker.username || 'Worker'}
                                  </h3>
                                  <div className="space-y-2">
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setMobileMenuOpen(null)
                                        setTimeout(() => handleViewPerformance(bw), 150)
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setMobileMenuOpen(null)
                                        setTimeout(() => handleViewPerformance(bw), 150)
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-base text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 active:bg-gray-200 dark:active:bg-slate-600 rounded-lg touch-manipulation transition-colors"
                                      type="button"
                                    >
                                      <Eye className="w-5 h-5 text-blue-500 dark:text-purple-500" />
                                      <span className="font-medium">View Performance</span>
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setMobileMenuOpen(null)
                                        setTimeout(() => handleRemoveClick(bw), 150)
                                      }}
                                      onTouchStart={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setMobileMenuOpen(null)
                                        setTimeout(() => handleRemoveClick(bw), 150)
                                      }}
                                      className="w-full flex items-center gap-3 px-4 py-3 text-base text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 active:bg-red-200 dark:active:bg-red-900/40 rounded-lg touch-manipulation transition-colors"
                                      type="button"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                      <span className="font-medium">Remove Worker</span>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <WorkerPerformanceModal
        isOpen={performanceModalOpen}
        onClose={() => {
          setPerformanceModalOpen(false)
          setSelectedWorker(null)
        }}
        worker={selectedWorker}
      />
      <RemoveWorkerConfirmation
        isOpen={removeModalOpen}
        onClose={() => {
          setRemoveModalOpen(false)
          setSelectedWorker(null)
        }}
        worker={selectedWorker}
        onConfirm={handleRemoveConfirm}
        loading={removing}
      />
    </DashboardLayout>
  )
}

