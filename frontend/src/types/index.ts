export interface ProductScore {
  registered_product_id: string
  serial_id: string
  product_name: string
  product_category: string
  product_type: string
  technology: string
  btu: number
  hp: number
  warranty_start: string | null
  warranty_end: string | null
  age_years: number | null
  age_cohort: string
  actual_tickets: number
  projected_tickets: number
  call_cost: number
  material_cost: number
  total_expenses: number
  contract_price: number | null
  gross_profit: number | null
  gross_margin_pct: number | null
  tier: string
  tier_color: TierColor
  disqualification_reason: string | null
}

export type TierColor = 'dark_green' | 'light_green' | 'yellow' | 'orange' | 'red' | 'gray'

export interface CustomerScore {
  account_id: string
  external_id: string
  name: string
  industry: string
  city: string
  is_blocked: boolean
  block_reason: string | null
  products: ProductScore[]
  best_tier: string
  best_margin: number | null
  total_revenue_potential: number
  total_expenses: number
  product_count: number
  eligible_product_count: number
}

export interface DashboardStats {
  total_customers: number
  eligible_customers: number
  blocked_customers: number
  total_products: number
  eligible_products: number
  tier_distribution: Record<string, number>
  total_revenue_potential: number
  total_expected_expenses: number
  avg_margin_pct: number | null
  private_count: number
  business_count: number
}

export interface SimulationParams {
  threshold_very_high: number
  threshold_high: number
  threshold_medium: number
  threshold_low: number
  call_cost_multiplier: number
  material_cost_multiplier: number
  junior_max_years: number
  senior_max_years: number
  senior_split_years: number
}

export const DEFAULT_PARAMS: SimulationParams = {
  threshold_very_high: 80,
  threshold_high: 75,
  threshold_medium: 70,
  threshold_low: 65,
  call_cost_multiplier: 1.0,
  material_cost_multiplier: 1.0,
  junior_max_years: 4.0,
  senior_max_years: 12.0,
  senior_split_years: 7.0,
}

export const TIER_LABELS = [
  'Very High Profitability',
  'High Profitability',
  'Medium Profitability',
  'Low Profitability',
  'Not Recommended',
]

export const TIER_CONFIG: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  dark_green: {
    bg: 'bg-green-900',
    text: 'text-green-100',
    border: 'border-green-700',
    dot: 'bg-green-400',
  },
  light_green: {
    bg: 'bg-green-700',
    text: 'text-green-50',
    border: 'border-green-500',
    dot: 'bg-green-300',
  },
  yellow: {
    bg: 'bg-yellow-600',
    text: 'text-yellow-50',
    border: 'border-yellow-400',
    dot: 'bg-yellow-300',
  },
  orange: {
    bg: 'bg-orange-600',
    text: 'text-orange-50',
    border: 'border-orange-400',
    dot: 'bg-orange-300',
  },
  red: {
    bg: 'bg-red-700',
    text: 'text-red-50',
    border: 'border-red-500',
    dot: 'bg-red-400',
  },
  gray: {
    bg: 'bg-gray-500',
    text: 'text-gray-50',
    border: 'border-gray-400',
    dot: 'bg-gray-300',
  },
}
