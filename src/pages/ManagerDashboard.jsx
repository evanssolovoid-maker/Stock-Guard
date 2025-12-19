import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  Package,
} from 'lucide-react'
import DashboardLayout from '../components/DashboardLayout'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import Button from '../components/Button'
import { useAuth } from '../hooks/useAuth'
import { useSalesStore } from '../store/salesStore'
import { useProductStore } from '../store/productStore'
import { salesService } from '../services/sales.service'
import { getBusinessOwnerId } from '../utils/business'
import { toast } from 'react-hot-toast'

export default function ManagerDashboard() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const {
    todayStats,
    recentSales,
    loadTodayStats,
    loadRecentSales,
    subscribeToSales,
    unsubscribeFromSales,
  } = useSalesStore()
  const { products, loadProducts, getLowStockProducts } = useProductStore()
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [topProduct, setTopProduct] = useState(null)
  const [topWorker, setTopWorker] = useState(null)
  const [loading, setLoading] = useState(true)
  const [ownerId, setOwnerId] = useState(null)
  const prevSalesLengthRef = useRef(0)

  // Get owner ID (in single company app, there's only one owner)
  useEffect(() => {
    const getOwnerId = async () => {
      try {
        // Get owner from owner_settings (there's only one)
        const { data, error } = await supabase
          .from('owner_settings')
          .select('owner_id')
          .limit(1)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching owner ID:', error)
        }

        if (data?.owner_id) {
          setOwnerId(data.owner_id)
        } else {
          // Fallback: get first owner from user_profiles
          const { data: ownerData } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('role', 'owner')
            .limit(1)
            .single()

          if (ownerData?.id) {
            setOwnerId(ownerData.id)
          }
        }
      } catch (error) {
        console.error('Error getting owner ID:', error)
      }
    }

    getOwnerId()
  }, [])

  // Request browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Load initial data
  useEffect(() => {
    if (user && profile?.role === 'manager' && ownerId) {
      const loadData = async () => {
        setLoading(true)
        try {
          await Promise.all([
            loadTodayStats(ownerId),
            loadRecentSales(ownerId),
            loadProducts(user),
          ])

          // Get low stock products
          const lowStock = getLowStockProducts(10)
          setLowStockProducts(lowStock)

          // Get top selling product today
          const topProducts = await salesService.getTopSellingProducts(ownerId, {}, 1)
          if (topProducts.length > 0) {
            setTopProduct(topProducts[0])
          }

          // Get top performing worker
          const workers = await salesService.getWorkerPerformance(ownerId, {})
          if (workers.length > 0) {
            const sorted = workers.sort((a, b) => b.totalRevenue - a.totalRevenue)
            setTopWorker(sorted[0])
          }
        } catch (error) {
          console.error('Error loading dashboard data:', error)
          toast.error('Failed to load dashboard data')
        } finally {
          setLoading(false)
        }
      }

      loadData()

      // Subscribe to real-time sales
      subscribeToSales(ownerId)

      return () => {
        unsubscribeFromSales()
      }
    }
  }, [user, profile, ownerId])

  // Update low stock products when products change
  useEffect(() => {
    if (products.length > 0) {
      setLowStockProducts(getLowStockProducts(10))
    }
  }, [products, getLowStockProducts])

  // Animate new sales
  useEffect(() => {
    if (recentSales.length > prevSalesLengthRef.current) {
      prevSalesLengthRef.current = recentSales.length
    }
  }, [recentSales])

  // Calculate growth percentage
  const revenueGrowth =
    todayStats.yesterdayRevenue > 0
      ? ((todayStats.revenue - todayStats.yesterdayRevenue) / todayStats.yesterdayRevenue) * 100
      : 0

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (profile?.role !== 'manager') {
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
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 dark:from-purple-600 dark:to-purple-700 p-6 text-white">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Welcome, {profile?.username || user?.username || 'Manager'}!
            </h1>
            <p className="text-blue-100 dark:text-purple-100">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(todayStats.revenue)}
            icon={DollarSign}
            color="purple"
            trend={{
              direction: revenueGrowth >= 0 ? 'up' : 'down',
              value: `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth.toFixed(1)}% vs yesterday`,
            }}
            onClick={() => navigate('/sales')}
          />

          <StatCard
            title="Sales Today"
            value={todayStats.count.toString()}
            icon={ShoppingCart}
            color="green"
            onClick={() => navigate('/sales')}
          />

          <StatCard
            title="Low Stock Alerts"
            value={lowStockProducts.length.toString()}
            icon={AlertTriangle}
            color={lowStockProducts.length > 0 ? 'red' : 'orange'}
            onClick={() => navigate('/products')}
          />

          <StatCard
            title="Total Products"
            value={products.length.toString()}
            icon={Package}
            color="blue"
            onClick={() => navigate('/products')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Widget */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Recent Sales
              </h2>
              <button
                onClick={() => navigate('/sales')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No sales today yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentSales.slice(0, 10).map((sale, index) => (
                  <div
                    key={sale.id}
                    className={`p-3 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all duration-200 ${
                      index === 0 && recentSales.length > prevSalesLengthRef.current
                        ? 'animate-pulse bg-blue-50 dark:bg-blue-900/20'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {sale.items && sale.items.length > 0 && sale.items[0]?.product?.image_url && (
                          <img
                            src={sale.items[0].product.image_url}
                            alt={sale.items[0].product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-slate-50 truncate">
                            {sale.items && sale.items.length > 0
                              ? sale.items.length === 1
                                ? sale.items[0].product?.name || 'Product'
                                : `${sale.items.length} items`
                              : 'Sale'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400">
                            {sale.worker?.business_name || sale.worker?.username || 'Worker'} •{' '}
                            {formatTimeAgo(sale.sale_date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(sale.final_total || 0)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {sale.items?.reduce((sum, item) => sum + (item.quantity_sold || 0), 0) || 0} units
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Low Stock Products Widget */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-50">
                Low Stock Alert
              </h2>
              <button
                onClick={() => navigate('/products')}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>All products well stocked ✓</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => {
                  const stockPercentage = (product.quantity / 10) * 100
                  return (
                    <div
                      key={product.id}
                      className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-slate-50 truncate">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                              {product.quantity} left
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => navigate('/products')}
                      >
                        View Product
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Selling Product Today */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
              Top Selling Product Today
            </h3>
            {topProduct ? (
              <div className="flex items-center gap-4">
                {topProduct.product?.image_url && (
                  <img
                    src={topProduct.product.image_url}
                    alt={topProduct.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-slate-50">
                    {topProduct.product?.name || 'Unknown'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      {topProduct.quantitySold} units sold
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(topProduct.revenue)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-slate-400">No sales today</p>
            )}
          </Card>

          {/* Best Performing Worker */}
          <Card>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
              Best Performing Worker
            </h3>
            {topWorker ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                    {topWorker.worker?.business_name?.[0]?.toUpperCase() ||
                      topWorker.worker?.username?.[0]?.toUpperCase() ||
                      'W'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-slate-50">
                    {topWorker.worker?.business_name || topWorker.worker?.username || 'Unknown Worker'}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-600 dark:text-slate-400">
                      {topWorker.totalSales} sales
                    </span>
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(topWorker.totalRevenue)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-slate-400">No worker data available</p>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}





