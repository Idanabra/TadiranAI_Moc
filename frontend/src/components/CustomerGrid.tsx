import { ChevronRight, Shield, ShieldOff } from 'lucide-react'
import type { CustomerScore, TierColor } from '../types'
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
        Scoring customers...
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 text-center text-slate-400">
        No customers match the selected filters.
      </div>
    )
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 bg-slate-900/60 border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <span>Customer</span>
        <span>Type</span>
        <span>Products</span>
        <span>Best Tier</span>
        <span>Revenue</span>
        <span>Margin</span>
        <span className="w-6" />
      </div>

      <div className="divide-y divide-slate-700/50">
        {customers.map((c) => {
          const tierColor = TIER_COLOR_MAP[c.best_tier] ?? 'gray'
          const rowClass = `row-${tierColor}`
          return (
            <button
              key={c.account_id}
              onClick={() => onSelect(c)}
              className={`w-full grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 text-left transition-colors cursor-pointer ${rowClass}`}
            >
              {/* Customer */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {c.is_blocked ? (
                    <ShieldOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  ) : (
                    <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
                  )}
                  <span className="font-medium text-slate-200 text-sm truncate">{c.name}</span>
                </div>
                <div className="text-slate-500 text-xs truncate ml-5">{c.city} · {c.account_id}</div>
              </div>

              {/* Type */}
              <div className="text-sm text-slate-300 self-center">
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${c.industry === 'Private' ? 'bg-blue-900/60 text-blue-300' : 'bg-purple-900/60 text-purple-300'}`}>
                  {c.industry}
                </span>
              </div>

              {/* Products */}
              <div className="text-sm text-slate-300 self-center">
                <span className="text-white font-medium">{c.eligible_product_count}</span>
                <span className="text-slate-500 text-xs"> / {c.product_count}</span>
              </div>

              {/* Best Tier */}
              <div className="self-center">
                {c.is_blocked ? (
                  <span className="text-xs text-red-400 font-medium">{c.block_reason ?? 'Blocked'}</span>
                ) : (
                  <TierBadge tier={c.best_tier} color={tierColor} small />
                )}
              </div>

              {/* Revenue */}
              <div className="text-sm text-slate-300 self-center font-medium">
                {fmtCurrency(c.total_revenue_potential)}
              </div>

              {/* Margin */}
              <div className="text-sm self-center font-semibold">
                {c.best_margin != null ? (
                  <span className={
                    c.best_margin >= 80 ? 'text-green-400' :
                    c.best_margin >= 75 ? 'text-green-300' :
                    c.best_margin >= 70 ? 'text-yellow-300' :
                    c.best_margin >= 65 ? 'text-orange-300' : 'text-red-400'
                  }>
                    {c.best_margin.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-slate-500">—</span>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-500 self-center" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
