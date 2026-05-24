from pydantic import BaseModel
from typing import Optional


class SimulationParams(BaseModel):
    threshold_very_high: float = 80.0   # >= this → Very High
    threshold_high: float = 75.0        # >= this → High
    threshold_medium: float = 70.0      # >= this → Medium
    threshold_low: float = 65.0         # >= this → Low  (below → Not Recommended)
    call_cost_multiplier: float = 1.0
    material_cost_multiplier: float = 1.0
    junior_max_years: float = 4.0       # age <= this → JUNIOR
    senior_max_years: float = 12.0      # age <= this → SENIOR (else uninsurable)
    senior_split_years: float = 7.0     # age <= this → SENIOR, else → SENIOR >7


class ProductScore(BaseModel):
    registered_product_id: str
    serial_id: str
    product_name: str
    product_category: str
    product_type: str
    technology: str
    btu: int
    hp: float
    warranty_start: Optional[str]
    warranty_end: Optional[str]
    age_years: Optional[float]
    age_cohort: str          # JUNIOR / SENIOR / SENIOR >7 / UNINSURABLE / EXCLUDED
    actual_tickets: int
    projected_tickets: float
    call_cost: float
    material_cost: float
    total_expenses: float
    contract_price: Optional[float]
    gross_profit: Optional[float]
    gross_margin_pct: Optional[float]
    tier: str                # Very High / High / Medium / Low / Not Recommended / Ineligible
    tier_color: str          # dark_green / light_green / yellow / orange / red / gray
    disqualification_reason: Optional[str]


class CustomerScore(BaseModel):
    account_id: str
    external_id: str
    name: str
    industry: str
    city: str
    is_blocked: bool
    block_reason: Optional[str]
    products: list[ProductScore]
    best_tier: str
    best_margin: Optional[float]
    total_revenue_potential: float
    total_expenses: float
    product_count: int
    eligible_product_count: int


class DashboardStats(BaseModel):
    total_customers: int
    eligible_customers: int
    blocked_customers: int
    total_products: int
    eligible_products: int
    tier_distribution: dict
    total_revenue_potential: float
    total_expected_expenses: float
    avg_margin_pct: Optional[float]
    private_count: int
    business_count: int
