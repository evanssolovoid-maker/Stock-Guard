import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'

const COLORS = [
  '#3B82F6',
  '#2563EB',
  '#1D4ED8',
  '#1E40AF',
  '#1E3A8A',
  '#9333EA',
  '#7C3AED',
  '#6D28D9',
  '#5B21B6',
  '#4C1D95',
]

export default function ProductPerformanceChart({ data }) {
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

  const chartData = data
    .map((item) => ({
      name: item.product?.name || 'Unknown',
      revenue: item.revenue || 0,
      image: item.product?.image_url,
    }))
    .slice(0, 10)

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          className="opacity-20 dark:opacity-10"
        />
        <XAxis type="number" stroke="currentColor" className="text-xs" />
        <YAxis
          type="category"
          dataKey="name"
          width={90}
          stroke="currentColor"
          className="text-xs"
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, white)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
          }}
          formatter={(value) => formatCurrency(value)}
        />
        <Bar dataKey="revenue" radius={[0, 8, 8, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
          <LabelList
            dataKey="revenue"
            position="right"
            formatter={(value) => formatCurrency(value)}
            className="text-xs fill-current"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}



