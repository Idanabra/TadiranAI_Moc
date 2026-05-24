import { Search, X } from 'lucide-react'
import { TIER_LABELS, TIER_LABELS_HE } from '../types'

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
  'bg-white border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors'

export default function FilterPanel({ filters, onChange }: Props) {
  const set = (key: keyof Filters, val: string) => onChange({ ...filters, [key]: val })
  const hasFilters = filters.search || filters.industry || filters.tier || filters.blocked

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search — icon on right for RTL */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או מזהה..."
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
            className="w-full bg-white border border-gray-300 text-gray-700 text-sm rounded-lg pr-9 pl-3 py-2 focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors placeholder:text-gray-400"
          />
        </div>

        <select className={SELECT_CLS} value={filters.industry} onChange={(e) => set('industry', e.target.value)}>
          <option value="">כל הסוגים</option>
          <option value="Private">פרטי</option>
          <option value="Business">עסקי</option>
        </select>

        <select className={SELECT_CLS} value={filters.tier} onChange={(e) => set('tier', e.target.value)}>
          <option value="">כל הרמות</option>
          {TIER_LABELS.map((t) => (
            <option key={t} value={t}>{TIER_LABELS_HE[t] ?? t}</option>
          ))}
          <option value="Blocked">חסום</option>
        </select>

        <select className={SELECT_CLS} value={filters.blocked} onChange={(e) => set('blocked', e.target.value)}>
          <option value="">כל הסטטוסים</option>
          <option value="false">כשירים בלבד</option>
          <option value="true">חסומים בלבד</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => onChange({ search: '', industry: '', tier: '', blocked: '' })}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-4 h-4" /> נקה
          </button>
        )}
      </div>
    </div>
  )
}
