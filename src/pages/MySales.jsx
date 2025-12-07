import { useState, useEffect, useMemo } from 'react'
import { Download, Eye } from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import DateRangePicker from '../components/DateRangePicker'
import SaleDetailsModal from '../components/SaleDetailsModal'
import { DollarSign, ShoppingCart, TrendingUp, BarChart3 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { salesService } from '../services/sales.service'
import { toast } from 'react-hot-toast'

export default function MySales() {
  const { user, profile } = useAuth()
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [summary, setSummary] = useState({
    totalCount: 0,
    totalRevenue: 0,
    averageAmount: 0,
  })

  useEffect(() => {
    if (user) {
      loadMySales()
    }
  }, [user, dateRange])

  const loadMySales = async () => {
    if (!user) return

    setLoading(true)
    try {
      const filters = {
        workerId: user.id, // For workers - show their own sales
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
      }

      // If manager, show all sales for their owner's business
      if (profile?.role === 'manager') {
        // Get owner ID for manager's business
        try {
          const ownerId = await salesService.getOwnerIdForWorker(user.id)
          if (ownerId) {
            filters.ownerId = ownerId
            delete filters.workerId
          }
        } catch (error) {
          console.error('Error getting owner ID:', error)
          // Fallback: show worker's own sales
        }
      }

      const result = await salesService.fetchSales(filters)
      const salesData = result.data || []

      setSales(salesData)

      // Calculate summary
      const totalRevenue = salesData.reduce(
        (sum, sale) => sum + parseFloat(sale.final_total || 0),
        0
      )
      const averageAmount = salesData.length > 0 ? totalRevenue / salesData.length : 0

      setSummary({
        totalCount: salesData.length,
        totalRevenue,
        averageAmount,
      })
    } catch (error) {
      console.error('Error loading my sales:', error)
      toast.error('Failed to load sales')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    try {
      const csv = salesService.exportSalesToCSV(sales)
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `my-sales-export-${new Date().toISOString().split('T')[0]}.csv`
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <ShoppingCart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">My Sales</h1>
          </div>
          <Button variant="secondary" onClick={handleExport} leadingIcon={Download}>
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setDateRange(null)
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Sales"
            value={summary.totalCount.toString()}
            icon={BarChart3}
            color="blue"
          />
          <StatCard
            title="Total Revenue"
            value={formatCurrency(summary.totalRevenue)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Average Sale Value"
            value={formatCurrency(summary.averageAmount)}
            icon={ShoppingCart}
            color="green"
          />
        </div>

        {/* Sales List */}
        <Card>
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            </div>
          ) : sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-slate-400">
              <p>No sales found</p>
              <p className="text-sm mt-2">Try adjusting your date range</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {/* Desktop View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Date/Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Items
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
                      {sales.map((sale) => (
                        <tr
                          key={sale.id}
                          className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-50">
                            {formatTimeAgo(sale.sale_date || sale.created_at)}
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
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4 p-4">
                {sales.map((sale) => (
                  <Card key={sale.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-slate-400">
                          {formatTimeAgo(sale.sale_date || sale.created_at)}
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
                            {sale.items?.reduce((sum, item) => sum + (item.quantity_sold || 0), 0) || 0} units
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
            </div>
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

