"""
Core scoring engine: implements the 5-step profitability pipeline from the PRD.
"""
from datetime import date, timedelta
from typing import Optional
from .models import SimulationParams, ProductScore, CustomerScore

# Blocking keywords from the Last Note Copy field (Hebrew)
BLOCK_KEYWORDS = {
    "לא מעוניין": ("Blocked", "Not Interested", 60),        # expires 2 months
    "לא ניתן לבטח": ("Permanent", "Uninsurable", None),
    "לצאת מרשימת תפוצה": ("Permanent", "DNC - Do Not Contact", None),
    "להתקשר לקראת סיום": ("Scheduled", "Call Near End", None),
    "אין כרטיס אשראי": ("Blocked", "No Credit Card", 90),   # expires 3 months
    "מבוטח בחברה אחרת": ("Blocked", "Insured Elsewhere", 365),  # expires 12 months
    "מספר טלפון שגוי": ("Blocked", "Wrong Phone", None),
}

# call_cost tech column values → ContractPrice Tech values
TECH_MAP_CALLCOST_TO_CONTRACT = {
    "Inverter": "INV",
    "On/Off": "on/off",
    "MULTI": "INV",
    "VRF": "INV",
}

# ContractPrice productType labels → call_cost productType labels
PRODUCT_TYPE_CONTRACT_TO_CALLCOST = {
    "עילי": "עילי",
    "מיני מרכזי": "מיני מרכזי",
    "MULTI": "MULTI",
    "super slim": "עילי",   # super slim uses wall-unit cost coefficients
    "VRF": "VRF",
    "BOX": "BOX",
}

# call_cost tech mapping from technology string
TECH_FOR_CALLCOST = {
    "INV": "Inverter",
    "on/off": "On/Off",
}


def _check_qualification(
    account: dict,
    serials: list[str],
    serial_tickets: dict,
    today: date,
) -> tuple[bool, Optional[str]]:
    """
    Returns (is_eligible, reason_string).
    Checks blocklist keywords and active outreach / open ticket rules.
    """
    last_note = account.get("last_note", "")

    for keyword, (status, label, expiry_days) in BLOCK_KEYWORDS.items():
        if keyword in last_note:
            if status == "Permanent":
                return False, label
            if status == "Blocked":
                # Time-based blocks: check if still within expiry window
                # Since we don't have a log timestamp, treat as active block
                return False, label
            if status == "Scheduled":
                return True, None  # re-entry eligible

    # Active outreach < 14 days (any ticket created in last 14 days)
    cutoff_14d = today - timedelta(days=14)
    for serial in serials:
        for ticket in serial_tickets.get(serial, []):
            if ticket.get("created_on") and ticket["created_on"] >= cutoff_14d:
                return False, "Active Outreach (< 14 days)"

    # Open Ombudsman / Escalation (tickets not in completed/closed status)
    open_statuses = {"נוצר", "משוחרר", "נעול"}
    for serial in serials:
        for ticket in serial_tickets.get(serial, []):
            if ticket.get("system_status") in open_statuses:
                return False, "Open Escalation / Ombudsman"

    return True, None


def _classify_age(warranty_start: Optional[date], today: date, params: SimulationParams) -> tuple[str, Optional[float]]:
    """Returns (cohort, age_years). Cohort: JUNIOR / SENIOR / SENIOR >7 / UNINSURABLE."""
    if warranty_start is None:
        return "UNKNOWN", None
    age_years = (today - warranty_start).days / 365.25
    if age_years <= params.junior_max_years:
        return "JUNIOR", round(age_years, 2)
    if age_years <= params.senior_split_years:
        return "SENIOR", round(age_years, 2)
    if age_years <= params.senior_max_years:
        return "SENIOR >7", round(age_years, 2)
    return "UNINSURABLE", round(age_years, 2)


def _is_excluded_model(product_name: str, product_category: str, excluded_models: set) -> bool:
    combined = f"{product_name} {product_category}".upper()
    for excluded in excluded_models:
        if excluded in combined:
            return True
    return False


def _lookup_call_cost(
    age_cohort: str, product_type: str, technology: str, call_costs: list
) -> Optional[dict]:
    """Find the matching call_cost row for this product."""
    # Map contract-side tech to call_cost tech
    cc_tech = TECH_FOR_CALLCOST.get(technology, "On/Off")

    # Map product type for call_cost table
    cc_product_type = PRODUCT_TYPE_CONTRACT_TO_CALLCOST.get(product_type, product_type)

    # Map SENIOR >7 to SENIOR >7, otherwise use exact cohort
    search_cohort = age_cohort  # JUNIOR / SENIOR / SENIOR >7

    # Try exact match first
    for row in call_costs:
        if row["age"] == search_cohort and row["product_type"] == cc_product_type:
            if row["tech"].lower() in cc_tech.lower() or cc_tech.lower() in row["tech"].lower():
                return row

    # Fallback: try with just SENIOR if SENIOR >7 not found
    if search_cohort == "SENIOR >7":
        for row in call_costs:
            if row["age"] == "SENIOR" and row["product_type"] == cc_product_type:
                if row["tech"].lower() in cc_tech.lower() or cc_tech.lower() in row["tech"].lower():
                    return row

    # Fallback: any matching product_type
    for row in call_costs:
        if row["age"] == search_cohort and row["product_type"] == cc_product_type:
            return row

    # Last resort: wall unit defaults
    for row in call_costs:
        if row["age"] in (search_cohort, "SENIOR") and row["product_type"] == "עילי":
            return row

    return None


def _project_tickets(
    warranty_start: date, actual_tickets: int, call_cost_row: dict, today: date
) -> float:
    """
    Project total 3-year ticket count per PRD formula:
    Total = actual_tickets + Σ(annual_coeff × remaining_year_fraction)

    The full 3-year coefficient sum acts as a floor to ensure future cost is
    never zero for a device that simply had no historical claims.
    """
    years_elapsed = min((today - warranty_start).days / 365.25, 3.0)

    y1_remaining = max(0.0, 1.0 - min(years_elapsed, 1.0))
    y2_remaining = max(0.0, min(1.0, 2.0 - years_elapsed)) if years_elapsed < 2.0 else 0.0
    y3_remaining = max(0.0, min(1.0, 3.0 - years_elapsed)) if years_elapsed < 3.0 else 0.0

    remaining_projection = (
        call_cost_row["year1"] * y1_remaining
        + call_cost_row["year2"] * y2_remaining
        + call_cost_row["year3"] * y3_remaining
    )
    formula_result = actual_tickets + remaining_projection

    # Floor: always project at least the full 3-year coefficient total
    # This ensures devices with no historical claims still reflect future risk
    full_coefficient = call_cost_row["year1"] + call_cost_row["year2"] + call_cost_row["year3"]
    return max(formula_result, full_coefficient)


def _get_hp_range(product_type: str, hp: float) -> str:
    """Map HP value to ContractPrice 'sus' bracket."""
    if product_type == "עילי":
        if hp <= 2.0:
            return "2"
        return "2.5-4"

    if product_type == "מיני מרכזי":
        if hp <= 4.0:
            return "2.5-4"
        if hp <= 7.0:
            return "4.5-7"
        return "7.5+"

    if product_type == "MULTI":
        # sus = number of indoor units (approximately total HP / HP-per-unit)
        if hp <= 2.0:
            return "1:2"
        if hp <= 5.0:
            return "1:3-5"
        return "1:8-9"

    if product_type == "super slim":
        return "25-35"

    return "2.5-4"


def _lookup_contract_price(
    product_type: str,
    technology: str,
    age_cohort: str,
    hp: float,
    industry: str,
    contract_prices: list,
) -> Optional[float]:
    """Multi-dimensional lookup for 3-year contract price."""
    # For ContractPrice lookup, SENIOR >7 maps to SENIOR
    lookup_age = "SENIOR" if age_cohort in ("SENIOR", "SENIOR >7") else "JUNIOR"
    is_private = industry.lower() in ("private", "פרטי", "z1")
    price_col = "private_3y" if is_private else "business_3y"

    sus_target = _get_hp_range(product_type, hp)

    for row in contract_prices:
        if (
            row["product_type"] == product_type
            and row["tech"].upper() == technology.upper()
            and row["sus"] == sus_target
            and row["age"] == lookup_age
        ):
            price = row.get(price_col)
            if price is not None and price != "-":
                return float(price)

    # Fallback: relax sus matching (take the closest HP range for this type/tech/age)
    candidates = [
        r for r in contract_prices
        if r["product_type"] == product_type
        and r["tech"].upper() == technology.upper()
        and r["age"] == lookup_age
        and r.get(price_col) is not None
    ]
    if candidates:
        return float(candidates[0][price_col])

    # Fallback: relax technology
    candidates = [
        r for r in contract_prices
        if r["product_type"] == product_type
        and r["age"] == lookup_age
        and r.get(price_col) is not None
    ]
    if candidates:
        return float(candidates[0][price_col])

    return None


def _tier_from_margin(margin_pct: float, params: SimulationParams) -> tuple[str, str]:
    """Returns (tier_label, color_key)."""
    if margin_pct >= params.threshold_very_high:
        return "Very High Profitability", "dark_green"
    if margin_pct >= params.threshold_high:
        return "High Profitability", "light_green"
    if margin_pct >= params.threshold_medium:
        return "Medium Profitability", "yellow"
    if margin_pct >= params.threshold_low:
        return "Low Profitability", "orange"
    return "Not Recommended", "red"


def score_all(data: dict, params: SimulationParams) -> list[CustomerScore]:
    """
    Run the full scoring pipeline for every customer and their registered products.
    Returns a list of CustomerScore objects sorted by best_margin descending.
    """
    today = date.today()
    accounts = data["accounts"]
    customer_products = data["customer_products"]
    serial_tickets = data["serial_tickets"]
    contract_prices = data["contract_prices"]
    call_costs = data["call_costs"]
    excluded_models = data["excluded_models"]

    results: list[CustomerScore] = []

    for account_id, account in accounts.items():
        products = customer_products.get(account_id, [])
        if not products:
            continue

        # Collect all serials for this customer
        all_serials = [p["serial_id"] for p in products if p.get("serial_id")]

        # Account-level qualification check
        is_eligible, block_reason = _check_qualification(
            account, all_serials, serial_tickets, today
        )

        scored_products: list[ProductScore] = []
        total_revenue = 0.0
        total_expenses_sum = 0.0
        best_margin: Optional[float] = None
        best_tier = "Not Recommended"

        for rp in products:
            product_type = rp.get("product_type")
            if not product_type:
                # Non-AC product — skip scoring
                score = ProductScore(
                    registered_product_id=rp["rp_id"],
                    serial_id=rp["serial_id"],
                    product_name=rp["product_name"],
                    product_category=rp["product_category"],
                    product_type="N/A",
                    technology="N/A",
                    btu=rp["btu"],
                    hp=rp["hp"],
                    warranty_start=str(rp["warranty_start"]) if rp["warranty_start"] else None,
                    warranty_end=str(rp["warranty_end"]) if rp["warranty_end"] else None,
                    age_years=None,
                    age_cohort="NON_AC",
                    actual_tickets=0,
                    projected_tickets=0.0,
                    call_cost=0.0,
                    material_cost=0.0,
                    total_expenses=0.0,
                    contract_price=None,
                    gross_profit=None,
                    gross_margin_pct=None,
                    tier="N/A",
                    tier_color="gray",
                    disqualification_reason="Non-AC product",
                )
                scored_products.append(score)
                continue

            # Step A: classify age
            age_cohort, age_years = _classify_age(rp["warranty_start"], today, params)

            # Exclusion model check
            if _is_excluded_model(rp["product_name"], rp["product_category"], excluded_models):
                scored_products.append(ProductScore(
                    registered_product_id=rp["rp_id"],
                    serial_id=rp["serial_id"],
                    product_name=rp["product_name"],
                    product_category=rp["product_category"],
                    product_type=product_type,
                    technology=rp["technology"],
                    btu=rp["btu"],
                    hp=rp["hp"],
                    warranty_start=str(rp["warranty_start"]) if rp["warranty_start"] else None,
                    warranty_end=str(rp["warranty_end"]) if rp["warranty_end"] else None,
                    age_years=age_years,
                    age_cohort="EXCLUDED",
                    actual_tickets=0,
                    projected_tickets=0.0,
                    call_cost=0.0,
                    material_cost=0.0,
                    total_expenses=0.0,
                    contract_price=None,
                    gross_profit=None,
                    gross_margin_pct=None,
                    tier="Ineligible",
                    tier_color="gray",
                    disqualification_reason="Excluded model",
                ))
                continue

            if age_cohort == "UNINSURABLE":
                scored_products.append(ProductScore(
                    registered_product_id=rp["rp_id"],
                    serial_id=rp["serial_id"],
                    product_name=rp["product_name"],
                    product_category=rp["product_category"],
                    product_type=product_type,
                    technology=rp["technology"],
                    btu=rp["btu"],
                    hp=rp["hp"],
                    warranty_start=str(rp["warranty_start"]) if rp["warranty_start"] else None,
                    warranty_end=str(rp["warranty_end"]) if rp["warranty_end"] else None,
                    age_years=age_years,
                    age_cohort="UNINSURABLE",
                    actual_tickets=0,
                    projected_tickets=0.0,
                    call_cost=0.0,
                    material_cost=0.0,
                    total_expenses=0.0,
                    contract_price=None,
                    gross_profit=None,
                    gross_margin_pct=None,
                    tier="Ineligible",
                    tier_color="gray",
                    disqualification_reason="Aged equipment (> 12 years)",
                ))
                continue

            if age_cohort == "UNKNOWN":
                scored_products.append(ProductScore(
                    registered_product_id=rp["rp_id"],
                    serial_id=rp["serial_id"],
                    product_name=rp["product_name"],
                    product_category=rp["product_category"],
                    product_type=product_type,
                    technology=rp["technology"],
                    btu=rp["btu"],
                    hp=rp["hp"],
                    warranty_start=None,
                    warranty_end=str(rp["warranty_end"]) if rp["warranty_end"] else None,
                    age_years=None,
                    age_cohort="UNKNOWN",
                    actual_tickets=0,
                    projected_tickets=0.0,
                    call_cost=0.0,
                    material_cost=0.0,
                    total_expenses=0.0,
                    contract_price=None,
                    gross_profit=None,
                    gross_margin_pct=None,
                    tier="Ineligible",
                    tier_color="gray",
                    disqualification_reason="Missing warranty start date",
                ))
                continue

            # Step B: ticket history
            serial = rp.get("serial_id", "")
            device_tickets = serial_tickets.get(serial, [])
            warranty_start = rp["warranty_start"]

            actual_tickets = sum(
                1 for t in device_tickets
                if t.get("created_on") and warranty_start and t["created_on"] >= warranty_start
            )

            # Step B/C: call cost lookup
            cc_row = _lookup_call_cost(age_cohort, product_type, rp["technology"], call_costs)
            if cc_row is None:
                cc_row = {
                    "year1": 0.3, "year2": 0.25, "year3": 0.25,
                    "call_cost": 150.0, "material_cost": 20.13
                }

            projected_tickets = _project_tickets(warranty_start, actual_tickets, cc_row, today)

            call_cost_val = cc_row["call_cost"] * params.call_cost_multiplier
            material_cost_val = cc_row["material_cost"] * params.material_cost_multiplier
            total_expenses = projected_tickets * (call_cost_val + material_cost_val)

            # Step D: contract price
            contract_price = _lookup_contract_price(
                product_type,
                rp["technology"],
                age_cohort,
                rp["hp"],
                account["industry"],
                contract_prices,
            )

            # Step E: margin
            if contract_price and contract_price > 0:
                gross_profit = contract_price - total_expenses
                gross_margin_pct = (gross_profit / contract_price) * 100.0
                tier, tier_color = _tier_from_margin(gross_margin_pct, params)

                if is_eligible:
                    total_revenue += contract_price
                    total_expenses_sum += total_expenses
                    if best_margin is None or gross_margin_pct > best_margin:
                        best_margin = gross_margin_pct
                        best_tier = tier
            else:
                gross_profit = None
                gross_margin_pct = None
                tier = "No Pricing"
                tier_color = "gray"

            scored_products.append(ProductScore(
                registered_product_id=rp["rp_id"],
                serial_id=serial,
                product_name=rp["product_name"],
                product_category=rp["product_category"],
                product_type=product_type,
                technology=rp["technology"],
                btu=rp["btu"],
                hp=rp["hp"],
                warranty_start=str(warranty_start) if warranty_start else None,
                warranty_end=str(rp["warranty_end"]) if rp["warranty_end"] else None,
                age_years=age_years,
                age_cohort=age_cohort,
                actual_tickets=actual_tickets,
                projected_tickets=round(projected_tickets, 2),
                call_cost=round(call_cost_val, 2),
                material_cost=round(material_cost_val, 2),
                total_expenses=round(total_expenses, 2),
                contract_price=contract_price,
                gross_profit=round(gross_profit, 2) if gross_profit is not None else None,
                gross_margin_pct=round(gross_margin_pct, 1) if gross_margin_pct is not None else None,
                tier=tier,
                tier_color=tier_color,
                disqualification_reason=block_reason if not is_eligible else None,
            ))

        eligible_count = sum(
            1 for p in scored_products
            if p.tier not in ("Ineligible", "N/A", "No Pricing") and p.gross_margin_pct is not None
        )

        results.append(CustomerScore(
            account_id=account_id,
            external_id=account["external_id"],
            name=account["name"],
            industry=account["industry"],
            city=account["city"],
            is_blocked=not is_eligible,
            block_reason=block_reason,
            products=scored_products,
            best_tier=best_tier if is_eligible else "Blocked",
            best_margin=round(best_margin, 1) if best_margin is not None else None,
            total_revenue_potential=round(total_revenue, 2),
            total_expenses=round(total_expenses_sum, 2),
            product_count=len(scored_products),
            eligible_product_count=eligible_count,
        ))

    results.sort(key=lambda c: c.best_margin if c.best_margin is not None else -999, reverse=True)
    return results
