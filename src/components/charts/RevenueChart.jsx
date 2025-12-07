import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
} from 'recharts'

export default function RevenueChart({ data, dateRange, showComparison = false, comparisonData }) {
  const formatCurrency = (value) => {
    return `UGX ${parseFloat(value || 0).toLocaleString()}`
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-slate-400">
        <p>No data available</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="gradientPrimary" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradientPurple" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#9333EA" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#9333EA" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="opacity-20 dark:opacity-10"
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
            backgroundColor: 'var(--tooltip-bg, white)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
          formatter={(value) => [formatCurrency(value), 'Revenue']}
          labelFormatter={formatDate}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          fill="url(#gradientPrimary)"
          strokeWidth={3}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ fill: '#3B82F6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Revenue"
        />
        {showComparison && comparisonData && (
          <Line
            type="monotone"
            dataKey="revenue"
            data={comparisonData}
            stroke="#9333EA"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#9333EA', r: 3 }}
            name="Previous Period"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}



