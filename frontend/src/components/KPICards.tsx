import { TrendingUp, Users, Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import type { DashboardStats } from '../types'

function fmt(n: number, decimals = 0) {
  return n.toLocaleString('he-IL', { maximumFractionDigits: decimals })
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
  iconBg: string
}

function Card({ title, value, sub, icon, color, iconBg }: CardProps) {
  return (
    <div className={`rounded-xl p-5 flex items-start gap-4 border ${color}`}>
      <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>{icon}</div>
      <div>
        <p className="text-gray-500 text-xs font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5" dir="ltr">{value}</p>
        {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function KPICards({ stats }: { stats: DashboardStats }) {
  const netProfit = stats.total_revenue_potential - stats.total_expected_expenses
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card
        title="סה״כ לקוחות"
        value={fmt(stats.total_customers)}
        sub={`${fmt(stats.private_count)} פרטי · ${fmt(stats.business_count)} עסקי`}
        icon={<Users className="w-5 h-5 text-blue-600" />}
        color="border-gray-200 bg-white"
        iconBg="bg-blue-50"
      />
      <Card
        title="לקוחות כשירים"
        value={fmt(stats.eligible_customers)}
        sub={`${fmt(stats.blocked_customers)} חסומים`}
        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
        color="border-green-200 bg-green-50"
        iconBg="bg-green-100"
      />
      <Card
        title="מוצרים שניקודו"
        value={fmt(stats.eligible_products)}
        sub={`מתוך ${fmt(stats.total_products)} סה״כ`}
        icon={<Package className="w-5 h-5 text-indigo-600" />}
        color="border-gray-200 bg-white"
        iconBg="bg-indigo-50"
      />
      <Card
        title="פוטנציאל הכנסות"
        value={fmtCurrency(stats.total_revenue_potential)}
        sub="חוזים ל-3 שנים"
        icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
        color="border-emerald-200 bg-emerald-50"
        iconBg="bg-emerald-100"
      />
      <Card
        title="הוצאות צפויות"
        value={fmtCurrency(stats.total_expected_expenses)}
        sub="עלות שירות צפויה"
        icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
        color="border-orange-200 bg-orange-50"
        iconBg="bg-orange-100"
      />
      <Card
        title="שולי רווח ממוצעים"
        value={stats.avg_margin_pct != null ? `${stats.avg_margin_pct.toFixed(1)}%` : '—'}
        sub={netProfit > 0 ? `נטו ${fmtCurrency(netProfit)}` : ''}
        icon={<TrendingUp className="w-5 h-5 text-purple-600" />}
        color="border-purple-200 bg-purple-50"
        iconBg="bg-purple-100"
      />
    </div>
  )
}
