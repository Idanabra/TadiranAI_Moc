import { useEffect } from 'react'
import { X, Shield, ShieldOff, Thermometer, Calendar, Ticket, DollarSign } from 'lucide-react'
import type { CustomerScore, ProductScore, TierColor } from '../types'
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
  'JUNIOR': 'light_green',
  'SENIOR': 'yellow',
}

function fmtCurrency(n: number) {
  return `₪${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function ProductRow({ p }: { p: ProductScore }) {
  const tierColor = TIER_COLOR_MAP[p.tier] ?? 'gray'
  const rowClass = `row-${tierColor}`

  return (
    <tr className={`${rowClass} border-b border-slate-700/30`}>
      <td className="px-3 py-2.5">
        <div className="text-sm font-medium text-slate-200">{p.product_category}</div>
        <div className="text-xs text-slate-500">{p.serial_id}</div>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-300">
        <div>{p.product_type}</div>
        <div className="text-slate-500">{p.technology}</div>
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          p.age_cohort === 'JUNIOR' ? 'bg-blue-900/60 text-blue-300' :
          p.age_cohort === 'SENIOR' ? 'bg-yellow-900/60 text-yellow-300' :
          p.age_cohort === 'SENIOR >7' ? 'bg-orange-900/60 text-orange-300' :
          'bg-red-900/60 text-red-300'
        }`}>
          {p.age_cohort}
        </span>
        {p.age_years != null && (
          <div className="text-xs text-slate-500 mt-0.5">{p.age_years.toFixed(1)}yr</div>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs text-center">
        <span className="text-slate-200 font-medium">{p.actual_tickets}</span>
        <span className="text-slate-500"> / {p.projected_tickets.toFixed(1)}</span>
      </td>
      <td className="px-3 py-2.5 text-xs text-slate-300">
        {p.contract_price != null ? (
          <div>
            <div className="text-slate-200 font-medium">{fmtCurrency(p.contract_price)}</div>
            <div className="text-slate-500">exp: {fmtCurrency(p.total_expenses)}</div>
          </div>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 text-xs text-center">
        {p.gross_margin_pct != null ? (
          <span className={`font-bold ${
            p.gross_margin_pct >= 80 ? 'text-green-400' :
            p.gross_margin_pct >= 75 ? 'text-green-300' :
            p.gross_margin_pct >= 70 ? 'text-yellow-300' :
            p.gross_margin_pct >= 65 ? 'text-orange-300' : 'text-red-400'
          }`}>
            {p.gross_margin_pct.toFixed(1)}%
          </span>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5">
        {p.disqualification_reason ? (
          <span className="text-xs text-slate-500 italic">{p.disqualification_reason}</span>
        ) : (
          <TierBadge tier={p.tier} color={tierColor} small />
        )}
      </td>
    </tr>
  )
}

interface Props {
  customer: CustomerScore
  onClose: () => void
}

export default function CustomerDetailModal({ customer, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const eligibleProducts = customer.products.filter(
    (p) => p.gross_margin_pct != null
  )
  const ineligibleProducts = customer.products.filter(
    (p) => p.gross_margin_pct == null
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl mt-8 mb-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700">
          <div>
            <div className="flex items-center gap-3">
              {customer.is_blocked ? (
                <ShieldOff className="w-6 h-6 text-red-400" />
              ) : (
                <Shield className="w-6 h-6 text-green-400" />
              )}
              <h2 className="text-xl font-bold text-white">{customer.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                customer.industry === 'Private'
                  ? 'bg-blue-900/60 text-blue-300'
                  : 'bg-purple-900/60 text-purple-300'
              }`}>
                {customer.industry}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-slate-400">
              <span>ID: {customer.account_id}</span>
              <span>Ext: {customer.external_id}</span>
              <span>{customer.city}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        {customer.is_blocked ? (
          <div className="mx-6 mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-center gap-3">
            <ShieldOff className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <span className="text-red-300 font-semibold text-sm">Customer Blocked</span>
              <span className="text-red-400 text-sm ml-2">— {customer.block_reason}</span>
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-4 p-3 bg-green-900/20 border border-green-700 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-400 shrink-0" />
            <span className="text-green-300 font-semibold text-sm">Eligible for Campaign</span>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4">
          {[
            {
              icon: <Thermometer className="w-4 h-4 text-blue-400" />,
              label: 'Total Products',
              value: customer.product_count,
            },
            {
              icon: <Ticket className="w-4 h-4 text-indigo-400" />,
              label: 'Scored Products',
              value: customer.eligible_product_count,
            },
            {
              icon: <DollarSign className="w-4 h-4 text-emerald-400" />,
              label: 'Revenue Potential',
              value: customer.total_revenue_potential > 0
                ? fmtCurrency(customer.total_revenue_potential)
                : '—',
            },
            {
              icon: <Calendar className="w-4 h-4 text-purple-400" />,
              label: 'Best Margin',
              value: customer.best_margin != null
                ? `${customer.best_margin.toFixed(1)}%`
                : '—',
            },
          ].map((s) => (
            <div key={s.label} className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-xs text-slate-400 uppercase tracking-wide">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-white">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Eligible Products Table */}
        {eligibleProducts.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
              Scored Products ({eligibleProducts.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-slate-700">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-700">
                    {['Product', 'Type', 'Age', 'Tickets (Act/Proj)', 'Price / Cost', 'Margin', 'Tier'].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {eligibleProducts.map((p) => (
                    <ProductRow key={p.registered_product_id} p={p} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Ineligible Products */}
        {ineligibleProducts.length > 0 && (
          <div className="px-6 pb-6">
            <details className="group">
              <summary className="text-sm font-semibold text-slate-500 mb-2 cursor-pointer hover:text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-600 inline-block" />
                Ineligible / Non-AC Products ({ineligibleProducts.length})
                <span className="text-xs font-normal">(click to expand)</span>
              </summary>
              <div className="overflow-x-auto rounded-lg border border-slate-700 mt-2">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-900/80 border-b border-slate-700">
                      {['Product', 'Type', 'Age Cohort', 'Reason'].map((h) => (
                        <th key={h} className="px-3 py-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ineligibleProducts.map((p) => (
                      <tr key={p.registered_product_id} className="border-b border-slate-700/30 row-gray">
                        <td className="px-3 py-2 text-sm text-slate-400">{p.product_category}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{p.product_type}</td>
                        <td className="px-3 py-2 text-xs text-slate-500">{p.age_cohort}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 italic">
                          {p.disqualification_reason ?? p.tier}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
