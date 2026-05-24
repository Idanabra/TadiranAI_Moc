import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { DashboardStats } from '../types'
import { TIER_LABELS_HE } from '../types'

const TIER_COLORS: Record<string, string> = {
  'Very High Profitability': '#166534',
  'High Profitability': '#16a34a',
  'Medium Profitability': '#ca8a04',
  'Low Profitability': '#c2410c',
  'Not Recommended': '#b91c1c',
  'No Pricing': '#9ca3af',
  'Ineligible': '#d1d5db',
}

interface Props {
  stats: DashboardStats
}

export default function TierChart({ stats }: Props) {
  const pieData = Object.entries(stats.tier_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, label: TIER_LABELS_HE[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value)

  const barData = pieData.slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">פיזור רמות מוצרים</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#d1d5db'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number, name: string) => [value.toLocaleString('he-IL'), TIER_LABELS_HE[name] ?? name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#6b7280', fontSize: 11 }}>{TIER_LABELS_HE[value] ?? value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">כמות לפי רמה</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
            />
            <Bar dataKey="value" name="מוצרים" radius={[4, 4, 0, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#d1d5db'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
