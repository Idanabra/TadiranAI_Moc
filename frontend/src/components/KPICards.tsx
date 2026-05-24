import { TrendingUp, Users, Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import type { DashboardStats } from '../types'

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `₪${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₪${(n / 1_000).toFixed(0)}K`
  return `₪${fmt(n)}`
}

interface CardProps {
  title: string
  value: string
  sub?: string
  icon: React.ReactNode
  color: string
}

function Card({ title, value, sub, icon, color }: CardProps) {
  return (
    <div className={`rounded-xl p-5 flex items-start gap-4 border ${color}`}>
      <div className="p-2 rounded-lg bg-slate-800/60">{icon}</div>
      <div>
        <p className="text-slate-400 text-xs uppercase tracking-wider font-medium">{title}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-slate-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function KPICards({ stats }: { stats: DashboardStats }) {
  const netProfit = stats.total_revenue_potential - stats.total_expected_expenses
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card
        title="Total Customers"
        value={fmt(stats.total_customers)}
        sub={`${fmt(stats.private_count)} Private · ${fmt(stats.business_count)} Biz`}
        icon={<Users className="w-5 h-5 text-blue-400" />}
        color="border-slate-700 bg-slate-800/40"
      />
      <Card
        title="Eligible Customers"
        value={fmt(stats.eligible_customers)}
        sub={`${fmt(stats.blocked_customers)} blocked`}
        icon={<CheckCircle className="w-5 h-5 text-green-400" />}
        color="border-green-800 bg-green-900/20"
      />
      <Card
        title="Scored Products"
        value={fmt(stats.eligible_products)}
        sub={`of ${fmt(stats.total_products)} total`}
        icon={<Package className="w-5 h-5 text-indigo-400" />}
        color="border-slate-700 bg-slate-800/40"
      />
      <Card
        title="Revenue Potential"
        value={fmtCurrency(stats.total_revenue_potential)}
        sub="3-year contracts"
        icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
        color="border-emerald-800 bg-emerald-900/20"
      />
      <Card
        title="Expected Expenses"
        value={fmtCurrency(stats.total_expected_expenses)}
        sub="service cost projected"
        icon={<AlertTriangle className="w-5 h-5 text-orange-400" />}
        color="border-orange-800 bg-orange-900/20"
      />
      <Card
        title="Avg Gross Margin"
        value={stats.avg_margin_pct != null ? `${stats.avg_margin_pct.toFixed(1)}%` : '—'}
        sub={netProfit > 0 ? `Net ${fmtCurrency(netProfit)}` : ''}
        icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
        color="border-purple-800 bg-purple-900/20"
      />
    </div>
  )
}
