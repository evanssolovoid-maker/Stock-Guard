import { useState, useEffect, useMemo } from 'react'
import { Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import DateRangePicker from '../components/DateRangePicker'
import FilterChip from '../components/FilterChip'
import SaleDetailsModal from '../components/SaleDetailsModal'
import { DollarSign, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useSalesStore } from '../store/salesStore'
import { salesService } from '../services/sales.service'
import { toast } from 'react-hot-toast'

const ITEMS_PER_PAGE = 50

export default function Sales() {
  const { user, profile } = useAuth()
  const { sales, loading, loadSales, subscribeToSales, unsubscribeFromSales } = useSalesStore()
  const [dateRange, setDateRange] = useState(null)
  const [selectedWorker, setSelectedWorker] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState('sale_date')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selectedSale, setSelectedSale] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [ownerId, setOwnerId] = useState(null)
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalRevenue: 0,
    averageAmount: 0,
    growth: 0,
  })

  // Get the correct owner ID (only needed for managers)
  useEffect(() => {
    const getCorrectOwnerId = async () => {
      if (!user || !profile) return

      if (profile.role === 'manager') {
        // For managers, fetch the owner's ID
        try {
          const ownerIdValue = await salesService.getOwnerIdForWorker(user.id)
          setOwnerId(ownerIdValue)
        } catch (error) {
          console.error('Error getting owner ID for manager:', error)
          toast.error('Failed to load owner information')
        }
      }
    }

    if (profile?.role === 'manager') {
      getCorrectOwnerId()
    }
  }, [user, profile])

  // Load sales when filters change
  useEffect(() => {
    if (user && profile) {
      loadSalesData()
    }
  }, [user, profile, ownerId, dateRange, selectedWorker, selectedProduct, minAmount, maxAmount, currentPage])

  // Subscribe to real-time sales updates (for owners/managers)
  useEffect(() => {
    if (user && profile && (profile.role === 'owner' || profile.role === 'manager')) {
      const effectiveOwnerId = profile.role === 'owner' ? user.id : ownerId
      if (effectiveOwnerId) {
        subscribeToSales(effectiveOwnerId)
        return () => {
          unsubscribeFromSales()
        }
      }
    }
  }, [user, profile, ownerId, subscribeToSales, unsubscribeFromSales])

  const loadSalesData = async () => {
    if (!user || !profile) return

    try {
      // Determine the correct owner ID
      let correctOwnerId
      if (profile.role === 'owner') {
        correctOwnerId = user.id
      } else if (profile.role === 'manager') {
        // For managers, wait for ownerId to be fetched
        if (!ownerId) {
          return // Wait for ownerId to be set
        }
        correctOwnerId = ownerId
      } else {
        // Workers shouldn't access this page, but handle it anyway
        return
      }

      const filters = {
        ownerId: correctOwnerId,
        workerId: selectedWorker,
        productId: selectedProduct,
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        limit: ITEMS_PER_PAGE,
        offset: (currentPage - 1) * ITEMS_PER_PAGE,
      }

      const result = await loadSales(filters)

      // Calculate summary from the result (sales are now in the store)
      const allSales = result.data || []
      const totalRevenue = allSales.reduce(
        (sum, sale) => sum + parseFloat(sale.final_total || 0),
        0
      )
      const averageAmount = allSales.length > 0 ? totalRevenue / allSales.length : 0

      setSummary({
        totalCount: result.count || 0,
        totalRevenue,
        averageAmount,
        growth: 0, // TODO: Calculate growth vs previous period
      })
    } catch (error) {
      console.error('Error loading sales:', error)
      toast.error('Failed to load sales: ' + (error.message || 'Unknown error'))
    }
  }

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedSales = useMemo(() => {
    const sorted = [...sales]
    sorted.sort((a, b) => {
      let aVal, bVal

      switch (sortField) {
        case 'sale_date':
          aVal = new Date(a.sale_date)
          bVal = new Date(b.sale_date)
          break
        case 'total_amount':
          aVal = parseFloat(a.final_total || 0)
          bVal = parseFloat(b.final_total || 0)
          break
        case 'quantity_sold':
          aVal = (a.items || []).reduce((sum, item) => sum + (item.quantity_sold || 0), 0)
          bVal = (b.items || []).reduce((sum, item) => sum + (item.quantity_sold || 0), 0)
          break
        default:
          return 0
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1
      } else {
        return aVal < bVal ? 1 : -1
      }
    })

    return sorted
  }, [sales, sortField, sortDirection])

  const handleExport = () => {
    try {
      const csv = salesService.exportSalesToCSV(sales)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sales-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Sales exported successfully')
    } catch (error) {
      console.error('Error exporting sales:', error)
      toast.error('Failed to export sales')
    }
  }

  const handleViewDetails = (sale) => {
    setSelectedSale(sale)
    setDetailsModalOpen(true)
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const totalPages = Math.ceil(summary.totalCount / ITEMS_PER_PAGE)

  const activeFilters = [
    dateRange && { label: 'Date Range', value: 'Custom' },
    selectedWorker && { label: 'Worker', value: selectedWorker },
    selectedProduct && { label: 'Product', value: selectedProduct },
    minAmount && { label: 'Min Amount', value: minAmount },
    maxAmount && { label: 'Max Amount', value: maxAmount },
  ].filter(Boolean)

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">Sales History</h1>
          <Button variant="secondary" onClick={handleExport} leadingIcon={Download}>
            Export
          </Button>
        </div>

        {/* Filters Card */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
            Filters
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <DateRangePicker value={dateRange} onChange={setDateRange} />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Min Amount (UGX)
              </label>
              <input
                type="number"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                Max Amount (UGX)
              </label>
              <input
                type="number"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="input-field"
                placeholder="No limit"
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setDateRange(null)
                  setSelectedWorker(null)
                  setSelectedProduct(null)
                  setMinAmount('')
                  setMaxAmount('')
                  setCurrentPage(1)
                }}
                fullWidth
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
              {activeFilters.map((filter, index) => (
                <FilterChip
                  key={index}
                  label={filter.label}
                  value={filter.value}
                  onRemove={() => {
                    if (filter.label === 'Date Range') setDateRange(null)
                    if (filter.label === 'Worker') setSelectedWorker(null)
                    if (filter.label === 'Product') setSelectedProduct(null)
                    if (filter.label === 'Min Amount') setMinAmount('')
                    if (filter.label === 'Max Amount') setMaxAmount('')
                  }}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Transactions"
            value={summary.totalCount.toString()}
            icon={BarChart3}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="purple"
            trend={
              summary.growth !== 0
                ? {
                    direction: summary.growth >= 0 ? 'up' : 'down',
                    value: `${summary.growth >= 0 ? '+' : ''}${summary.growth.toFixed(1)}% Growth`,
                  }
                : undefined
            }
          />
          <StatCard
            title="Average Sale Value"
            value={formatCurrency(summary.averageAmount)}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            title="Growth Rate"
            value={`${summary.growth >= 0 ? '+' : ''}${summary.growth.toFixed(1)}%`}
            icon={TrendingUp}
            color={summary.growth >= 0 ? 'green' : 'red'}
          />
        </div>

        {/* Sales Table */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : sortedSales.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              <p>No sales found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => handleSort('sale_date')}
                      >
                        Date/Time
                        {sortField === 'sale_date' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Items
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Worker
                      </th>
                      <th
                        className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => handleSort('quantity_sold')}
                      >
                        Quantity
                        {sortField === 'quantity_sold' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700"
                        onClick={() => handleSort('total_amount')}
                      >
                        Amount
                        {sortField === 'total_amount' && (
                          <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                    {sortedSales.map((sale, index) => (
                      <tr
                        key={sale.id}
                        className={`hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-50">
                          {formatTimeAgo(sale.sale_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {sale.items && sale.items.length > 0 && sale.items[0]?.product?.image_url && (
                              <img
                                src={sale.items[0].product.image_url}
                                alt={sale.items[0].product.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-slate-50">
                              {sale.items && sale.items.length > 0
                                ? sale.items.length === 1
                                  ? sale.items[0].product?.name || 'Product'
                                  : `${sale.items.length} items`
                                : 'Sale'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {sale.worker?.business_name?.[0]?.toUpperCase() ||
                                  sale.worker?.username?.[0]?.toUpperCase() ||
                                  'W'}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900 dark:text-slate-50">
                              {sale.worker?.business_name || sale.worker?.username || 'Worker'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-slate-50">
                          {sale.items?.reduce((sum, item) => sum + (item.quantity_sold || 0), 0) || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(sale.final_total || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleViewDetails(sale)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {sortedSales.map((sale) => (
                  <Card key={sale.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {formatTimeAgo(sale.sale_date)}
                        </span>
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(sale.final_total || 0)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        {sale.items && sale.items.length > 0 && sale.items[0]?.product?.image_url && (
                          <img
                            src={sale.items[0].product.image_url}
                            alt={sale.items[0].product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 dark:text-slate-50">
                            {sale.items && sale.items.length > 0
                              ? sale.items.length === 1
                                ? sale.items[0].product?.name || 'Product'
                                : `${sale.items.length} items`
                              : 'Sale'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {sale.items?.reduce((sum, item) => sum + (item.quantity_sold || 0), 0) || 0} units •{' '}
                            {sale.worker?.business_name || sale.worker?.username || 'Worker'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        fullWidth
                        onClick={() => handleViewDetails(sale)}
                        leadingIcon={Eye}
                      >
                        View Details
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700">
                  <div className="text-sm text-gray-700 dark:text-slate-300">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * ITEMS_PER_PAGE, summary.totalCount)} of{' '}
                    {summary.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      leadingIcon={ChevronLeft}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-700 dark:text-slate-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      trailingIcon={ChevronRight}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Sale Details Modal */}
      <SaleDetailsModal
        sale={selectedSale}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedSale(null)
        }}
      />
    </DashboardLayout>
  )
}

