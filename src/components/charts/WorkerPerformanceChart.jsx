import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

export default function WorkerPerformanceChart({ data }) {
  const formatCurrency = (value) => {
    return `UGX ${parseFloat(value || 0).toLocaleString()}`
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
        <p>No data available</p>
      </div>
    )
  }

  const chartData = data.map((item) => ({
    name: item.worker?.business_name || item.worker?.email || 'Worker',
    revenue: item.totalRevenue || 0,
    sales: item.totalSales || 0,
  }))

  // Calculate max revenue for gradient
  const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  const getColor = (revenue) => {
    const ratio = revenue / maxRevenue
    if (ratio >= 0.8) return '#10B981' // Green
    if (ratio >= 0.6) return '#3B82F6' // Blue
    if (ratio >= 0.4) return '#F59E0B' // Amber
    if (ratio >= 0.2) return '#F97316' // Orange
    return '#EF4444' // Red
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="opacity-20 dark:opacity-10"
        />
        <XAxis
          dataKey="name"
          stroke="currentColor"
          className="text-xs"
          angle={-45}
          textAnchor="end"
          height={100}
        />
        <YAxis
          tickFormatter={(value) => `UGX ${(value / 1000).toFixed(0)}k`}
          stroke="currentColor"
          className="text-xs"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, white)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
          }}
          formatter={(value, name) => [
            name === 'revenue' ? formatCurrency(value) : value,
            name === 'revenue' ? 'Revenue' : 'Sales',
          ]}
        />
        <Bar dataKey="revenue" radius={[8, 8, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getColor(entry.revenue)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}



