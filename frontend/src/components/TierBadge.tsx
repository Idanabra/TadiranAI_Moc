import type { TierColor } from '../types'

const TIER_STYLES: Record<TierColor, string> = {
  dark_green: 'bg-green-900 text-green-200 border border-green-700',
  light_green: 'bg-green-700 text-green-100 border border-green-500',
  yellow: 'bg-yellow-600 text-yellow-100 border border-yellow-400',
  orange: 'bg-orange-700 text-orange-100 border border-orange-500',
  red: 'bg-red-800 text-red-100 border border-red-600',
  gray: 'bg-slate-700 text-slate-300 border border-slate-600',
}

interface Props {
  tier: string
  color: TierColor
  small?: boolean
}

export default function TierBadge({ tier, color, small = false }: Props) {
  const style = TIER_STYLES[color] ?? TIER_STYLES.gray
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} ${style}`}
    >
      <span className={`mr-1.5 rounded-full ${small ? 'w-1.5 h-1.5' : 'w-2 h-2'} ${color === 'dark_green' ? 'bg-green-400' : color === 'light_green' ? 'bg-green-300' : color === 'yellow' ? 'bg-yellow-300' : color === 'orange' ? 'bg-orange-300' : color === 'red' ? 'bg-red-400' : 'bg-slate-400'}`} />
      {tier}
    </span>
  )
}
