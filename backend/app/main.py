from contextlib import asynccontextmanager
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import threading

from .data_loader import load_all_data
from .engine import score_all
from .models import SimulationParams, CustomerScore, DashboardStats

# Global state
_data: dict = {}
_default_scores: list[CustomerScore] = []
_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _data, _default_scores
    print("Loading data from Excel...")
    _data = load_all_data()
    print(f"Loaded {len(_data['accounts'])} accounts, "
          f"{len(_data['registered_products'])} products, "
          f"{sum(len(v) for v in _data['serial_tickets'].values())} tickets")
    _default_scores = score_all(_data, SimulationParams())
    print(f"Scored {len(_default_scores)} customers")
    yield


app = FastAPI(title="AC Warranty Scoring Engine", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

TIER_ORDER = [
    "Very High Profitability",
    "High Profitability",
    "Medium Profitability",
    "Low Profitability",
    "Not Recommended",
    "Blocked",
    "No Pricing",
    "Ineligible",
    "N/A",
]


def _compute_stats(scores: list[CustomerScore]) -> DashboardStats:
    tier_dist = {}
    total_revenue = 0.0
    total_expenses = 0.0
    margins = []
    private_count = 0
    business_count = 0
    blocked = 0
    eligible = 0

    for cs in scores:
        if cs.is_blocked:
            blocked += 1
        elif cs.eligible_product_count > 0:
            eligible += 1

        if cs.industry.lower() in ("private", "פרטי"):
            private_count += 1
        else:
            business_count += 1

        total_revenue += cs.total_revenue_potential
        total_expenses += cs.total_expenses

        for p in cs.products:
            if p.gross_margin_pct is not None:
                tier_dist[p.tier] = tier_dist.get(p.tier, 0) + 1
                if not cs.is_blocked:
                    margins.append(p.gross_margin_pct)

    total_products = sum(len(cs.products) for cs in scores)
    eligible_products = sum(cs.eligible_product_count for cs in scores)

    return DashboardStats(
        total_customers=len(scores),
        eligible_customers=eligible,
        blocked_customers=blocked,
        total_products=total_products,
        eligible_products=eligible_products,
        tier_distribution=tier_dist,
        total_revenue_potential=round(total_revenue, 2),
        total_expected_expenses=round(total_expenses, 2),
        avg_margin_pct=round(sum(margins) / len(margins), 1) if margins else None,
        private_count=private_count,
        business_count=business_count,
    )


@app.get("/api/stats", response_model=DashboardStats)
def get_stats():
    return _compute_stats(_default_scores)


@app.get("/api/customers", response_model=list[CustomerScore])
def get_customers(
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    blocked: Optional[bool] = Query(None),
    limit: int = Query(200),
    offset: int = Query(0),
):
    results = _default_scores
    if search:
        s = search.strip().lower()
        results = [
            c for c in results
            if s in c.account_id.lower()
            or s in c.external_id.lower()
            or s in c.name.lower()
        ]
    if industry:
        results = [c for c in results if c.industry.lower() == industry.lower()]
    if blocked is not None:
        results = [c for c in results if c.is_blocked == blocked]
    if tier:
        results = [c for c in results if c.best_tier == tier]
    return results[offset: offset + limit]


@app.get("/api/customers/{account_id}", response_model=CustomerScore)
def get_customer(account_id: str):
    for c in _default_scores:
        if c.account_id == account_id:
            return c
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Customer not found")


@app.post("/api/simulate", response_model=list[CustomerScore])
def simulate(
    params: SimulationParams,
    search: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    tier: Optional[str] = Query(None),
    blocked: Optional[bool] = Query(None),
    limit: int = Query(200),
    offset: int = Query(0),
):
    scores = score_all(_data, params)
    if search:
        s = search.strip().lower()
        scores = [
            c for c in scores
            if s in c.account_id.lower()
            or s in c.external_id.lower()
            or s in c.name.lower()
        ]
    if industry:
        scores = [c for c in scores if c.industry.lower() == industry.lower()]
    if blocked is not None:
        scores = [c for c in scores if c.is_blocked == blocked]
    if tier:
        scores = [c for c in scores if c.best_tier == tier]
    return scores[offset: offset + limit]


@app.post("/api/simulate/stats", response_model=DashboardStats)
def simulate_stats(params: SimulationParams):
    scores = score_all(_data, params)
    return _compute_stats(scores)


@app.get("/api/health")
def health():
    return {"status": "ok", "customers": len(_default_scores)}
