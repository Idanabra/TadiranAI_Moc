import { ChevronLeft, Shield, ShieldOff } from 'lucide-react'
import type { CustomerScore, TierColor } from '../types'
import { industryLabel, isPrivate, TIER_LABELS_HE } from '../types'
import TierBadge from './TierBadge'

const TIER_COLOR_MAP: Record<string, TierColor> = {
  'Very High Profitability': 'dark_green',
  'High Profitability': 'light_green',
  'Medium Profitability': 'yellow',
  'Low Profitability': 'orange',
  'Not Recommended': 'red',
  'Blocked': 'gray',
  'No Pricing': 'gray',
  'Ineligible': 'gray',
  'N/A': 'gray',
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `₪${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₪${(n / 1_000).toFixed(0)}K`
  return n > 0 ? `₪${n.toFixed(0)}` : '—'
}

interface Props {
  customers: CustomerScore[]
  onSelect: (c: CustomerScore) => void
  loading?: boolean
}

export default function CustomerGrid({ customers, onSelect, loading }: Props) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        מנקד לקוחות...
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500 shadow-sm">
        לא נמצאו לקוחות התואמים לפילטרים.
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <span>לקוח</span>
        <span>סוג</span>
        <span>מוצרים</span>
        <span>רמה מיטבית</span>
        <span>הכנסה</span>
        <span>שולי רווח</span>
        <span className="w-4" />
      </div>

      <div className="divide-y divide-gray-100">
        {customers.map((c) => {
          const tierColor = TIER_COLOR_MAP[c.best_tier] ?? 'gray'
          const rowClass = `row-${tierColor}`
          return (
            <button
              key={c.account_id}
              onClick={() => onSelect(c)}
              className={`w-full grid grid-cols-[2fr_1fr_1fr_1.5fr_1fr_1fr_auto] gap-2 px-4 py-3 text-right transition-colors cursor-pointer ${rowClass}`}
            >
              {/* Customer name */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {c.is_blocked ? (
                    <ShieldOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  )}
                  <span className="font-medium text-gray-800 text-sm truncate">{c.name}</span>
                </div>
                <div className="text-gray-400 text-xs truncate mr-5">{c.city} · {c.account_id}</div>
              </div>

              {/* Industry */}
              <div className="text-sm self-center">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${isPrivate(c.industry) ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                  {industryLabel(c.industry)}
                </span>
              </div>

              {/* Products */}
              <div className="text-sm text-gray-600 self-center" dir="ltr">
                <span className="text-gray-900 font-medium">{c.eligible_product_count}</span>
                <span className="text-gray-400 text-xs"> / {c.product_count}</span>
              </div>

              {/* Best Tier */}
              <div className="self-center">
                {c.is_blocked ? (
                  <span className="text-xs text-red-600 font-medium">{c.block_reason ?? 'חסום'}</span>
                ) : (
                  <TierBadge tier={c.best_tier} color={tierColor} small />
                )}
              </div>

              {/* Revenue */}
              <div className="text-sm text-gray-700 self-center font-medium" dir="ltr">
                {fmtCurrency(c.total_revenue_potential)}
              </div>

              {/* Margin */}
              <div className="text-sm self-center font-semibold" dir="ltr">
                {c.best_margin != null ? (
                  <span className={
                    c.best_margin >= 80 ? 'text-green-700' :
                    c.best_margin >= 75 ? 'text-green-600' :
                    c.best_margin >= 70 ? 'text-yellow-600' :
                    c.best_margin >= 65 ? 'text-orange-600' : 'text-red-600'
                  }>
                    {c.best_margin.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>

              <ChevronLeft className="w-4 h-4 text-gray-400 self-center" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
