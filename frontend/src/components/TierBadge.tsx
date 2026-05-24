import type { TierColor } from '../types'
import { TIER_LABELS_HE } from '../types'

const TIER_STYLES: Record<TierColor, string> = {
  dark_green: 'bg-green-100 text-green-800 border border-green-300',
  light_green: 'bg-green-50 text-green-700 border border-green-200',
  yellow: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
  orange: 'bg-orange-50 text-orange-800 border border-orange-200',
  red: 'bg-red-50 text-red-800 border border-red-200',
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
}

const DOT_COLORS: Record<TierColor, string> = {
  dark_green: 'bg-green-600',
  light_green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  gray: 'bg-gray-400',
}

interface Props {
  tier: string
  color: TierColor
  small?: boolean
}

export default function TierBadge({ tier, color, small = false }: Props) {
  const style = TIER_STYLES[color] ?? TIER_STYLES.gray
  const dot = DOT_COLORS[color] ?? DOT_COLORS.gray
  const label = TIER_LABELS_HE[tier] ?? tier
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${style}`}>
      <span className={`rounded-full shrink-0 ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${dot}`} />
      {label}
    </span>
  )
}
