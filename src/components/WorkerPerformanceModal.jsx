import { useState, useEffect } from 'react'
import { X, TrendingUp, DollarSign, ShoppingCart, Award } from 'lucide-react'
import Modal from './Modal'
import StatCard from './StatCard'
import Button from './Button'
import { workersService } from '../services/workers.service'
import { salesService } from '../services/sales.service'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'react-hot-toast'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const PERIODS = [
  { label: 'Today', days: 0 },
  { label: 'This Week', days: 7 },
  { label: 'This Month', days: 30 },
  { label: 'All Time', days: null },
]

export default function WorkerPerformanceModal({ isOpen, onClose, worker }) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [performance, setPerformance] = useState(null)
  const [selectedPeriod, setSelectedPeriod] = useState(PERIODS[0])
  const [ownerId, setOwnerId] = useState(null)

  // Get the correct owner ID (only needed for managers)
  useEffect(() => {
    const getCorrectOwnerId = async () => {
      if (!user || !profile) return

      if (profile.role === 'owner') {
        // For owners, use their own ID
        setOwnerId(user.id)
      } else if (profile.role === 'manager') {
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

    getCorrectOwnerId()
  }, [user, profile])

  useEffect(() => {
    if (isOpen && worker && user && profile && ownerId) {
      loadPerformance()
    }
  }, [isOpen, worker, selectedPeriod, user, profile, ownerId])

  const loadPerformance = async () => {
    if (!worker || !ownerId) return

    setLoading(true)
    try {
      const workerId = worker.worker?.id || worker.id
      
      if (!workerId) {
        throw new Error('Worker ID not found')
      }

      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      
      let startDate = null
      if (selectedPeriod.days !== null && selectedPeriod.days > 0) {
        startDate = new Date(today)
        startDate.setDate(startDate.getDate() - selectedPeriod.days)
        startDate.setHours(0, 0, 0, 0)
      } else if (selectedPeriod.days === 0) {
        // Today only
        startDate = new Date(today)
        startDate.setHours(0, 0, 0, 0)
      }
      // For "All Time" (days === null), startDate remains null

      const dateRange = {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: today.toISOString().split('T')[0],
      }

      const data = await workersService.getWorkerPerformance(ownerId, workerId, dateRange)

      setPerformance(data)
    } catch (error) {
      console.error('Error loading performance:', error)
      toast.error('Failed to load performance data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  if (!worker) return null

  const workerData = worker.worker || worker
  const stats = performance?.stats || {
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    successRate: 100,
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <span className="text-blue-600 dark:text-blue-400 font-semibold text-2xl">
              {workerData.business_name?.[0]?.toUpperCase() ||
                workerData.username?.[0]?.toUpperCase() ||
                'W'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              {workerData.business_name || workerData.username || 'Worker'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">
              @{workerData.username || 'worker'}
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {PERIODS.map((period) => (
              <button
                key={period.label}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod.label === period.label
                    ? 'bg-blue-500 dark:bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : performance ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <StatCard
                title="Total Sales"
                value={stats.totalSales.toString()}
                icon={ShoppingCart}
                color="blue"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.totalRevenue)}
                icon={DollarSign}
                color="purple"
              />
              <StatCard
                title="Average Sale"
                value={formatCurrency(stats.averageSale)}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Success Rate"
                value={`${stats.successRate}%`}
                icon={Award}
                color="orange"
              />
            </div>

            {/* Performance Chart */}
            {performance.chartData && performance.chartData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
                  Sales Over Time
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performance.chartData}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="currentColor"
                        className="opacity-20"
                      />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        stroke="currentColor"
                        className="text-xs"
                      />
                      <YAxis
                        tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}k`}
                        stroke="currentColor"
                        className="text-xs"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--tooltip-bg)',
                          border: '1px solid var(--tooltip-border)',
                          borderRadius: '8px',
                        }}
                        formatter={(value) => [formatCurrency(value), 'Revenue']}
                        labelFormatter={formatDate}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 4 }}
                        name="Revenue"
                      />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        stroke="#10B981"
                        strokeWidth={2}
                        dot={{ fill: '#10B981', r: 3 }}
                        name="Sales Count"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Recent Sales */}
            {performance.recentSales && performance.recentSales.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50 mb-4">
                  Recent Sales
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {performance.recentSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {sale.product?.image_url && (
                            <img
                              src={sale.product.image_url}
                              alt={sale.product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 dark:text-slate-50 truncate">
                              {sale.product?.name || 'Unknown Product'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-slate-400">
                              {formatDate(sale.sale_date)} • {sale.quantity_sold} units
                            </p>
                          </div>
                        </div>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(sale.line_total || sale.total_amount || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400">
            <p>No performance data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}

