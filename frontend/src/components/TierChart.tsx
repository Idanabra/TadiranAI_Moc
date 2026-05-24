import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import type { DashboardStats } from '../types'

const TIER_COLORS: Record<string, string> = {
  'Very High Profitability': '#166534',
  'High Profitability': '#16a34a',
  'Medium Profitability': '#ca8a04',
  'Low Profitability': '#c2410c',
  'Not Recommended': '#b91c1c',
  'No Pricing': '#6b7280',
  'Ineligible': '#475569',
}

const TIER_SHORT: Record<string, string> = {
  'Very High Profitability': 'Very High',
  'High Profitability': 'High',
  'Medium Profitability': 'Medium',
  'Low Profitability': 'Low',
  'Not Recommended': 'Not Rec.',
  'No Pricing': 'No Price',
  'Ineligible': 'Ineligible',
}

interface Props {
  stats: DashboardStats
}

export default function TierChart({ stats }: Props) {
  const pieData = Object.entries(stats.tier_distribution)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, short: TIER_SHORT[k] ?? k, value: v }))
    .sort((a, b) => b.value - a.value)

  const barData = pieData.slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pie */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Product Tier Distribution</h3>
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
                <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#475569'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              formatter={(value: number, name: string) => [value.toLocaleString(), name]}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{TIER_SHORT[value] ?? value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Count by Tier</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="short" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
            />
            <Bar dataKey="value" name="Products" radius={[4, 4, 0, 0]}>
              {barData.map((entry) => (
                <Cell key={entry.name} fill={TIER_COLORS[entry.name] ?? '#475569'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
