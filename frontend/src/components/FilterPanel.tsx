import { Search, X } from 'lucide-react'
import { TIER_LABELS } from '../types'

interface Filters {
  search: string
  industry: string
  tier: string
  blocked: string
}

interface Props {
  filters: Filters
  onChange: (f: Filters) => void
}

const SELECT_CLS =
  'bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-slate-500 transition-colors'

export default function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof Filters, val: string) => onChange({ ...filters, [key]: val })

  const hasFilters = filters.search || filters.industry || filters.tier || filters.blocked

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 hover:border-slate-500 transition-colors placeholder:text-slate-500"
          />
        </div>

        {/* Customer Type */}
        <select className={SELECT_CLS} value={filters.industry} onChange={(e) => set('industry', e.target.value)}>
          <option value="">All Types</option>
          <option value="Private">Private</option>
          <option value="Business">Business</option>
        </select>

        {/* Tier */}
        <select className={SELECT_CLS} value={filters.tier} onChange={(e) => set('tier', e.target.value)}>
          <option value="">All Tiers</option>
          {TIER_LABELS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
          <option value="Blocked">Blocked</option>
        </select>

        {/* Blocked */}
        <select
          className={SELECT_CLS}
          value={filters.blocked}
          onChange={(e) => set('blocked', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="false">Eligible Only</option>
          <option value="true">Blocked Only</option>
        </select>

        {/* Clear */}
        {hasFilters && (
          <button
            onClick={() => onChange({ search: '', industry: '', tier: '', blocked: '' })}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
