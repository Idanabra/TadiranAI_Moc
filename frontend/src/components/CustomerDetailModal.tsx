import { useEffect } from 'react'
import { X, Shield, ShieldOff, Thermometer, Calendar, Ticket, DollarSign } from 'lucide-react'
import type { CustomerScore, ProductScore, TierColor } from '../types'
import { TIER_LABELS_HE, industryLabel, isPrivate } from '../types'
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

const AGE_COHORT_HE: Record<string, string> = {
  'JUNIOR': 'ג׳וניור',
  'SENIOR': 'סניור',
  'SENIOR >7': 'סניור מעל 7',
  'UNINSURABLE': 'לא ניתן לביטוח',
  'UNKNOWN': 'לא ידוע',
  'EXCLUDED': 'מוחרג',
  'NON_AC': 'לא מזגן',
}

function fmtCurrency(n: number) {
  return `₪${n.toLocaleString('he-IL', { maximumFractionDigits: 0 })}`
}

function ProductRow({ p }: { p: ProductScore }) {
  const tierColor = TIER_COLOR_MAP[p.tier] ?? 'gray'
  const rowClass = `row-${tierColor}`

  return (
    <tr className={`${rowClass} border-b border-gray-100`}>
      <td className="px-3 py-2.5">
        <div className="text-sm font-medium text-gray-800">{p.product_category}</div>
        <div className="text-xs text-gray-400">{p.serial_id}</div>
      </td>
      <td className="px-3 py-2.5 text-xs text-gray-600">
        <div>{p.product_type}</div>
        <div className="text-gray-400">{p.technology}</div>
      </td>
      <td className="px-3 py-2.5">
        <span className={`text-xs px-2 py-0.5 rounded font-medium ${
          p.age_cohort === 'JUNIOR' ? 'bg-blue-100 text-blue-700' :
          p.age_cohort === 'SENIOR' ? 'bg-yellow-100 text-yellow-700' :
          p.age_cohort === 'SENIOR >7' ? 'bg-orange-100 text-orange-700' :
          'bg-red-100 text-red-700'
        }`}>
          {AGE_COHORT_HE[p.age_cohort] ?? p.age_cohort}
        </span>
        {p.age_years != null && (
          <div className="text-xs text-gray-400 mt-0.5" dir="ltr">{p.age_years.toFixed(1)} שנ׳</div>
        )}
      </td>
      <td className="px-3 py-2.5 text-xs text-center" dir="ltr">
        <span className="text-gray-800 font-medium">{p.actual_tickets}</span>
        <span className="text-gray-400"> / {p.projected_tickets.toFixed(1)}</span>
      </td>
      <td className="px-3 py-2.5 text-xs" dir="ltr">
        {p.contract_price != null ? (
          <div>
            <div className="text-gray-800 font-medium">{fmtCurrency(p.contract_price)}</div>
            <div className="text-gray-400">עלות: {fmtCurrency(p.total_expenses)}</div>
          </div>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5 text-xs text-center" dir="ltr">
        {p.gross_margin_pct != null ? (
          <span className={`font-bold ${
            p.gross_margin_pct >= 80 ? 'text-green-700' :
            p.gross_margin_pct >= 75 ? 'text-green-600' :
            p.gross_margin_pct >= 70 ? 'text-yellow-600' :
            p.gross_margin_pct >= 65 ? 'text-orange-600' : 'text-red-600'
          }`}>
            {p.gross_margin_pct.toFixed(1)}%
          </span>
        ) : '—'}
      </td>
      <td className="px-3 py-2.5">
        {p.disqualification_reason ? (
          <span className="text-xs text-gray-400 italic">{p.disqualification_reason}</span>
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

  const eligibleProducts = customer.products.filter((p) => p.gross_margin_pct != null)
  const ineligibleProducts = customer.products.filter((p) => p.gross_margin_pct == null)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-5xl mt-8 mb-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-3">
              {customer.is_blocked ? (
                <ShieldOff className="w-6 h-6 text-red-500" />
              ) : (
                <Shield className="w-6 h-6 text-green-600" />
              )}
              <h2 className="text-xl font-bold text-gray-900">{customer.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                isPrivate(customer.industry) ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {industryLabel(customer.industry)}
              </span>
            </div>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>מזהה: {customer.account_id}</span>
              <span>חיצוני: {customer.external_id}</span>
              <span>{customer.city}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status banner */}
        {customer.is_blocked ? (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <ShieldOff className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <span className="text-red-700 font-semibold text-sm">לקוח חסום</span>
              <span className="text-red-500 text-sm mr-2">— {customer.block_reason}</span>
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Shield className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-green-700 font-semibold text-sm">כשיר לקמפיין</span>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4">
          {[
            { icon: <Thermometer className="w-4 h-4 text-blue-600" />, label: 'סה״כ מוצרים', value: String(customer.product_count) },
            { icon: <Ticket className="w-4 h-4 text-indigo-600" />, label: 'מוצרים שניקודו', value: String(customer.eligible_product_count) },
            {
              icon: <DollarSign className="w-4 h-4 text-emerald-600" />,
              label: 'פוטנציאל הכנסות',
              value: customer.total_revenue_potential > 0 ? fmtCurrency(customer.total_revenue_potential) : '—',
            },
            {
              icon: <Calendar className="w-4 h-4 text-purple-600" />,
              label: 'שולי רווח מיטביים',
              value: customer.best_margin != null ? `${customer.best_margin.toFixed(1)}%` : '—',
            },
          ].map((s) => (
            <div key={s.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                {s.icon}
                <span className="text-xs text-gray-500 font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-bold text-gray-900" dir="ltr">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Eligible Products Table */}
        {eligibleProducts.length > 0 && (
          <div className="px-6 pb-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              מוצרים שניקודו ({eligibleProducts.length})
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {['מוצר', 'סוג', 'גיל', 'קריאות (בפועל/צפי)', 'מחיר / עלות', 'שולי רווח', 'רמה'].map((h) => (
                      <th key={h} className="px-3 py-2 text-xs text-gray-500 font-semibold uppercase tracking-wider">
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
              <summary className="text-sm font-semibold text-gray-400 mb-2 cursor-pointer hover:text-gray-600 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-300 inline-block" />
                מוצרים לא כשירים / לא מזגנים ({ineligibleProducts.length})
                <span className="text-xs font-normal">(לחץ להרחבה)</span>
              </summary>
              <div className="overflow-x-auto rounded-lg border border-gray-200 mt-2">
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {['מוצר', 'סוג', 'קבוצת גיל', 'סיבה'].map((h) => (
                        <th key={h} className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ineligibleProducts.map((p) => (
                      <tr key={p.registered_product_id} className="border-b border-gray-50 row-gray">
                        <td className="px-3 py-2 text-sm text-gray-500">{p.product_category}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{p.product_type}</td>
                        <td className="px-3 py-2 text-xs text-gray-400">{AGE_COHORT_HE[p.age_cohort] ?? p.age_cohort}</td>
                        <td className="px-3 py-2 text-xs text-gray-400 italic">
                          {p.disqualification_reason ?? (TIER_LABELS_HE[p.tier] ?? p.tier)}
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
