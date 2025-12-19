import { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  TrendingDown,
  Lightbulb,
  Medal,
  Trophy,
  Award,
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import DateRangePicker from '../components/DateRangePicker'
import RevenueChart from '../components/charts/RevenueChart'
import ProductPerformanceChart from '../components/charts/ProductPerformanceChart'
import CategoryPieChart from '../components/charts/CategoryPieChart'
import WorkerPerformanceChart from '../components/charts/WorkerPerformanceChart'
import { useAuth } from '../hooks/useAuth'
import { salesService } from '../services/sales.service'
import { supabase } from '../services/supabase'
import { toast } from 'react-hot-toast'

export default function Analytics() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [activeTab, setActiveTab] = useState('revenue')
  const [overview, setOverview] = useState({
    totalRevenue: 0,
    growthRate: 0,
    averageSale: 0,
    totalTransactions: 0,
  })
  const [revenueData, setRevenueData] = useState([])
  const [productData, setProductData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [workerData, setWorkerData] = useState([])
  const [hourlyData, setHourlyData] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [categoryTrends, setCategoryTrends] = useState([])

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
    if (user && profile && ownerId) {
      loadAnalytics()
    }
  }, [user, profile, ownerId, dateRange])

  // Subscribe to real-time sales updates
  useEffect(() => {
    if (!user || !profile || !ownerId) return

    const channel = supabase
      .channel('analytics-sales-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sales',
          filter: `business_owner_id=eq.${ownerId}`,
        },
        () => {
          // Reload analytics when new sale is added
          loadAnalytics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, ownerId])

  const loadAnalytics = async () => {
    if (!user || !profile || !ownerId) return

    setLoading(true)
    try {
      // Prepare date range - ensure we include the full day
      let range = dateRange
      if (!range) {
        const endDate = new Date()
        endDate.setHours(23, 59, 59, 999) // End of today
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0) // Start of day 30 days ago
        
        range = {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        }
      } else {
        // Ensure endDate covers the full day
        const endDateObj = new Date(range.endDate)
        endDateObj.setHours(23, 59, 59, 999)
        range = {
          ...range,
          endDate: endDateObj.toISOString().split('T')[0],
        }
      }

      // Load all analytics data in parallel
      const [
        revenue,
        products,
        categories,
        workers,
        hourly,
        daily,
        sales,
      ] = await Promise.all([
        salesService.getRevenueByDate(ownerId, range).catch(err => {
          console.error('Error loading revenue by date:', err)
          return []
        }),
        salesService.getTopSellingProducts(ownerId, range, 10).catch(err => {
          console.error('Error loading top products:', err)
          return []
        }),
        salesService.getSalesByCategory(ownerId, range).catch(err => {
          console.error('Error loading sales by category:', err)
          return []
        }),
        salesService.getWorkerPerformance(ownerId, range).catch(err => {
          console.error('Error loading worker performance:', err)
          return []
        }),
        salesService.getSalesByHour(ownerId, range).catch(err => {
          console.error('Error loading sales by hour:', err)
          return []
        }),
        salesService.getSalesByDayOfWeek(ownerId, range).catch(err => {
          console.error('Error loading sales by day:', err)
          return []
        }),
        salesService.fetchSales({ ownerId: ownerId, startDate: range.startDate, endDate: range.endDate }).catch(err => {
          console.error('Error loading sales:', err)
          return { data: [], count: 0 }
        }),
      ])

      setRevenueData(revenue || [])
      setProductData(products || [])
      setCategoryData(categories || [])
      setWorkerData(workers || [])
      setHourlyData(hourly || [])
      setDailyData(daily || [])

      // Calculate overview from actual sales data
      const totalRevenue = (sales?.data || []).reduce((sum, sale) => sum + parseFloat(sale.final_total || 0), 0)
      const totalTransactions = sales?.data?.length || 0
      const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0

      // Calculate growth (simplified - compare with previous period)
      const previousRange = {
        startDate: new Date(
          new Date(range.startDate).getTime() -
            (new Date(range.endDate).getTime() - new Date(range.startDate).getTime())
        )
          .toISOString()
          .split('T')[0],
        endDate: range.startDate,
      }
      const previousRevenue = await salesService.getRevenueByDate(ownerId, previousRange)
      const previousTotal = (previousRevenue || []).reduce((sum, r) => sum + (r.revenue || 0), 0)
      const growthRate =
        previousTotal > 0 ? ((totalRevenue - previousTotal) / previousTotal) * 100 : 0

      setOverview({
        totalRevenue,
        growthRate,
        averageSale,
        totalTransactions,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast.error('Failed to load analytics data: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `UGX ${parseFloat(amount || 0).toLocaleString()}`
  }

  const tabs = [
    { id: 'revenue', label: 'Revenue Analysis' },
    { id: 'products', label: 'Product Performance' },
    { id: 'team', label: 'Team Performance' },
    { id: 'trends', label: 'Trends & Insights' },
  ]

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
              <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-50">
              Analytics & Insights
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button variant="secondary" leadingIcon={Download}>
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(overview.totalRevenue)}
            icon={DollarSign}
            color="purple"
          />
          <StatCard
            title="Growth Rate"
            value={`${overview.growthRate >= 0 ? '+' : ''}${overview.growthRate.toFixed(1)}%`}
            icon={overview.growthRate >= 0 ? TrendingUp : TrendingDown}
            color={overview.growthRate >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Average Sale Value"
            value={formatCurrency(overview.averageSale)}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="Total Transactions"
            value={overview.totalTransactions.toString()}
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* Tabs */}
        <Card className="p-6">
          <div className="border-b border-gray-200 dark:border-slate-700 mb-6">
            <div className="flex gap-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-blue-500 dark:bg-purple-500 text-white'
                      : 'text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">
            {/* Revenue Analysis */}
            {activeTab === 'revenue' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                    Revenue Over Time
                  </h2>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 dark:border-slate-600"
                    />
                    <span className="text-gray-700 dark:text-slate-300">Compare with Previous Period</span>
                  </label>
                </div>
                <RevenueChart data={revenueData} dateRange={dateRange} />
              </div>
            )}

            {/* Product Performance */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Top Products by Revenue
                </h2>
                <ProductPerformanceChart data={productData} />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-slate-50 mb-4">
                      Sales by Category
                    </h3>
                    <CategoryPieChart data={categoryData} />
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-gray-900 dark:text-slate-50 mb-4">
                      Product Rankings
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {productData.map((item, index) => (
                        <div
                          key={item.product?.id || index}
                          className="p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-gray-500 dark:text-slate-400 w-6">
                                #{index + 1}
                              </span>
                              {item.product?.image_url && (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <span className="font-medium text-gray-900 dark:text-slate-50">
                                {item.product?.name || 'Unknown'}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-blue-600 dark:text-blue-400">
                                {formatCurrency(item.revenue)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">
                                {item.quantitySold} units
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team Performance */}
            {activeTab === 'team' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                  Worker Performance
                </h2>

                {/* Leaderboard */}
                {workerData.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {workerData
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 3)
                      .map((worker, index) => {
                        const medals = [Trophy, Medal, Award]
                        const MedalIcon = medals[index]
                        const colors = ['#F59E0B', '#94A3B8', '#CD7F32']

                        return (
                          <Card
                            key={worker.worker?.id || index}
                            className="p-4 relative overflow-hidden"
                          >
                            <div className="absolute top-2 right-2">
                              <MedalIcon className={`w-8 h-8 ${colors[index]}`} />
                            </div>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                                  {worker.worker?.business_name?.[0]?.toUpperCase() ||
                                    worker.worker?.username?.[0]?.toUpperCase() ||
                                    'W'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-slate-50 truncate">
                                  {worker.worker?.business_name || worker.worker?.username || 'Worker'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">
                                  Rank #{index + 1}
                                </p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Sales:</span>
                                <span className="font-semibold text-gray-900 dark:text-slate-50">
                                  {worker.totalSales}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-slate-400">Revenue:</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {formatCurrency(worker.totalRevenue)}
                                </span>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                  </div>
                )}

                <WorkerPerformanceChart data={workerData} />
              </div>
            )}

            {/* Trends & Insights */}
            {activeTab === 'trends' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Peak Hours */}
                  <Card className="p-6">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-slate-50 mb-4">
                      Peak Hours Analysis
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={hourlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                          <XAxis dataKey="hour" stroke="currentColor" className="text-xs" />
                          <YAxis stroke="currentColor" className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        💡 Most sales occur between 2pm-5pm
                      </p>
                    </div>
                  </Card>

                  {/* Day of Week */}
                  <Card className="p-6">
                    <h3 className="text-md font-semibold text-gray-900 dark:text-slate-50 mb-4">
                      Day of Week Analysis
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dailyData}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                          <XAxis dataKey="day" stroke="currentColor" className="text-xs" />
                          <YAxis stroke="currentColor" className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="revenue" fill="#9333EA" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-sm text-gray-700 dark:text-slate-300">
                        💡 Fridays are your busiest day
                      </p>
                    </div>
                  </Card>
                </div>

                {/* AI Insights (Placeholder) */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    <h3 className="text-md font-semibold text-gray-900 dark:text-slate-50">
                      AI-Generated Insights
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                      <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                        Electronics sales up 30% this month
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Consider restocking popular items
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700">
                      <p className="text-sm font-medium text-purple-800 dark:text-purple-300">
                        Worker performance improved 25%
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}

