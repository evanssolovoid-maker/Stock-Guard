import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = [
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  '#9333EA',
  '#7C3AED',
  '#10B981',
  '#059669',
  '#F59E0B',
  '#D97706',
  '#EF4444',
]

export default function CategoryPieChart({ data, onSegmentClick }) {
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
    name: item.category || 'Other',
    value: item.revenue || 0,
    count: item.count || 0,
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const percentage = ((data.value / total) * 100).toFixed(1)
      return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-slate-50">{data.name}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {data.payload.count} sales
          </p>
        </div>
      )
    }
    return null
  }

  const renderLabel = (entry) => {
    const percentage = ((entry.value / total) * 100).toFixed(0)
    return `${percentage}%`
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderLabel}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          onClick={onSegmentClick}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              className="cursor-pointer hover:opacity-80 transition-opacity"
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => value}
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}



