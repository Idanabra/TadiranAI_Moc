import pandas as pd
from pathlib import Path
from datetime import datetime, date

DATA_PATH = Path(__file__).parent.parent / "data" / "data.xlsx"

# Excel serial date origin
EXCEL_ORIGIN = pd.Timestamp("1899-12-30")

# Products excluded from warranty insurance (from לא לביטוח_notuse sheet)
EXCLUDED_MODELS = ["SPACE", "WIND R", "SUPER WIND R", "SUPER SLIM 25-35", "SUPER SLIM INV 25", "INVIZ"]

# Pricing group → AC product type
PRICING_GROUP_TO_TYPE = {
    "VRF": "VRF",
    "MINI VRF": "VRF",
    "VRF BOX": "BOX",
    "Multi": "MULTI",
    "Multi China": "MULTI",
    "Multi Toshiba": "MULTI",
    "Ducted": "מיני מרכזי",
    "Ducted Inverter": "מיני מרכזי",
    "מיני מרכזי - תדיראן": "מיני מרכזי",
    "מיני מרכזי - אמקור": "מיני מרכזי",
    "מיני-יבוא-אינוורטר": "מיני מרכזי",
    "מיני מרכזי - יבוא": "מיני מרכזי",
    "Space": "super slim",
}

# Non-AC pricing groups (white goods etc.) → skip from scoring
NON_AC_GROUPS = {
    "תנורים", "כיריים", "קולטי אדים", "מקררים סוג א'", "מקררים סוג ב'",
    "מוצרים קטנים", "S/P & Accessories", "אביזרים", "שירותים",
    "טכנולוגית טיהור אויר", "ניידים - תדיראן", "משאבות חום", "Aqua",
}

# Pricing groups that indicate Inverter technology
INVERTER_GROUPS = {
    "Ducted Inverter", "Supreme Inv", "Alpha Inv", "Solo Inv", "Amcor Inv",
    "Apollo Inv", "SFERA INV", "PLUS Inv", "Joy Inv", "מיני-יבוא-אינוורטר",
    "G2", "Inverter Toshiba",
}


def _normalize_sus(val) -> str:
    """Normalize the ContractPrice 'sus' (HP/unit size) column, fixing Excel date artifacts."""
    if val is None:
        return "2.5-4"
    if isinstance(val, (int, float)):
        # 0.043055... is Excel time "1:02" → means 1:2 multi-unit config
        if abs(val - 0.043055555555555555) < 1e-6:
            return "1:2"
        # 46177 & 46303 are Excel serial dates for corrupted HP range entries
        # Based on price ordering: 46177 = 4.5-7 HP (מיני מרכזי INV only entry)
        # 46303 = 7.5+ HP (מיני מרכזי on/off large units)
        if int(val) == 46177:
            return "4.5-7"
        if int(val) == 46303:
            return "7.5+"
    return str(val).strip()


def _detect_technology(product_name: str, category: str, pricing_group: str) -> str:
    """Return 'INV' or 'on/off' based on product details."""
    combined = f"{product_name} {category} {pricing_group}".upper()
    if "INV" in combined or "INVERTER" in combined:
        return "INV"
    if pricing_group in INVERTER_GROUPS:
        return "INV"
    return "on/off"


def _detect_product_type(pricing_group: str, category: str) -> str:
    """Map pricing group to AC product type. Returns None for non-AC products."""
    if pricing_group in NON_AC_GROUPS:
        return None
    if pricing_group in PRICING_GROUP_TO_TYPE:
        return PRICING_GROUP_TO_TYPE[pricing_group]
    # Default: wall unit (עילי) for all remaining AC pricing groups
    return "עילי"


def _extract_btu_from_name(category: str) -> int:
    """Try to extract BTU from product category name when BTU=0 in catalog."""
    import re
    # Pattern: "INV 350A" → 35,000 BTU (number × 100)
    m = re.search(r"\bINV\s+(\d{2,3})[RI]?A?\b", category, re.IGNORECASE)
    if m:
        return int(m.group(1)) * 100

    # Pattern: "TADIRAN 35A" / "AMCOR-IG 20" → number × 1,000 BTU
    m = re.search(r"\b(\d{2})\s*[A-Z]?\s*מ?[אָ]?דָ?[הָ]?$", category)
    if m:
        return int(m.group(1)) * 1000

    # Pattern: number followed by /3P or /3 (three-phase mini-central)
    m = re.search(r"\b(\d{2,3})/3", category)
    if m:
        return int(m.group(1)) * 1000

    # Fallback: find any standalone 2-digit number
    m = re.search(r"\b([1-9]\d)\b", category)
    if m:
        num = int(m.group(1))
        if 10 <= num <= 99:
            return num * 1000

    return 0


def load_all_data() -> dict:
    """Load and preprocess all sheets from the Excel workbook."""
    xl = pd.ExcelFile(DATA_PATH)

    # --- Account ---
    accounts_df = xl.parse("Account")
    accounts_df.columns = [c.strip() for c in accounts_df.columns]
    accounts = {}
    for _, row in accounts_df.iterrows():
        aid = str(row.get("AccountID", "")).strip()
        if aid:
            accounts[aid] = {
                "account_id": aid,
                "external_id": str(row.get("External ID", "")).strip(),
                "name": str(row.get("Name", "")).strip(),
                "industry": str(row.get("Industry", "")).strip(),
                "city": str(row.get("City", "")).strip(),
                "last_note": str(row.get("Last Note Copy", "")).strip()
                if pd.notna(row.get("Last Note Copy"))
                else "",
            }

    # --- Product catalog ---
    products_df = xl.parse("Product")
    products_df.columns = [c.strip() for c in products_df.columns]
    products_catalog = {}
    for _, row in products_df.iterrows():
        pid = str(row.get("ID", "")).strip()
        if pid:
            btu = int(row.get("BTU", 0) or 0)
            category = str(row.get("Category", "")).strip()
            pricing_group = str(row.get("קבוצת תמחיר חומר", "")).strip()
            if btu == 0:
                btu = _extract_btu_from_name(category)
            products_catalog[pid] = {
                "product_id": pid,
                "category_id": str(row.get("Category ID", "")).strip(),
                "category": category,
                "btu": btu,
                "pricing_group": pricing_group,
                "product_type": _detect_product_type(pricing_group, category),
                "technology": _detect_technology("", category, pricing_group),
            }

    # --- Registered Products ---
    rp_df = xl.parse("RegisterProduct")
    rp_df.columns = [c.strip() for c in rp_df.columns]
    registered_products = {}
    customer_products: dict[str, list] = {}

    for _, row in rp_df.iterrows():
        rp_id = str(row.get("ID", "")).strip()
        if not rp_id:
            continue
        serial = str(row.get("Serial ID", "")).strip()
        customer_id = str(row.get("Customer ID", "")).strip()
        product_id = str(row.get("Product ID", "")).strip()
        product_name = str(row.get("Product", "")).strip()

        warranty_start = row.get("Warranty Start Date")
        warranty_end = row.get("Warranty End Date")
        if pd.notna(warranty_start):
            warranty_start = pd.Timestamp(warranty_start).date()
        else:
            warranty_start = None
        if pd.notna(warranty_end):
            warranty_end = pd.Timestamp(warranty_end).date()
        else:
            warranty_end = None

        catalog_entry = products_catalog.get(product_id, {})
        btu = catalog_entry.get("btu", 0)
        if btu == 0:
            btu = _extract_btu_from_name(product_name)
        product_category = catalog_entry.get("category", product_name)
        pricing_group = catalog_entry.get("pricing_group", "")
        product_type = catalog_entry.get("product_type") or _detect_product_type(pricing_group, product_category)
        technology = catalog_entry.get("technology") or _detect_technology(product_name, product_category, pricing_group)

        rp = {
            "rp_id": rp_id,
            "serial_id": serial,
            "customer_id": customer_id,
            "product_id": product_id,
            "product_name": product_name,
            "product_category": product_category,
            "pricing_group": pricing_group,
            "btu": btu,
            "hp": round(btu / 9000, 2) if btu else 0.0,
            "product_type": product_type,
            "technology": technology,
            "warranty_start": warranty_start,
            "warranty_end": warranty_end,
        }
        registered_products[rp_id] = rp
        if customer_id:
            customer_products.setdefault(customer_id, []).append(rp)

    # --- Tickets ---
    tickets_df = xl.parse("Ticket")
    tickets_df.columns = [c.strip() for c in tickets_df.columns]
    # Index tickets by serial_id for fast lookup
    serial_tickets: dict[str, list] = {}
    for _, row in tickets_df.iterrows():
        serial = str(row.get("Serial ID", "")).strip()
        if not serial:
            continue
        created_on = row.get("Created On")
        created_date = None
        if pd.notna(created_on):
            try:
                created_date = pd.Timestamp(created_on).date()
            except Exception:
                pass
        system_status = str(row.get("System Status", "")).strip()
        serial_tickets.setdefault(serial, []).append({
            "created_on": created_date,
            "system_status": system_status,
            "account_id": str(row.get("AccountID", "")).strip(),
            "product_id": str(row.get("ProductId", "")).strip(),
        })

    # --- ContractPrice lookup table ---
    cp_df = xl.parse("ContractPrice")
    cp_df.columns = [c.strip() for c in cp_df.columns]
    contract_prices = []
    for _, row in cp_df.iterrows():
        price_private = row.get("private_3years")
        price_business = row.get("Business_3Years")
        contract_prices.append({
            "product_type": str(row.get("ProductType", "")).strip(),
            "tech": str(row.get("Tech", "")).strip(),
            "sus": _normalize_sus(row.get("sus")),
            "age": str(row.get("age", "")).strip(),
            "private_3y": None if str(price_private).strip() == "-" else float(price_private)
            if pd.notna(price_private)
            else None,
            "business_3y": None if str(price_business).strip() == "-" else float(price_business)
            if pd.notna(price_business)
            else None,
        })

    # --- call_cost lookup table ---
    cc_df = xl.parse("call_cost")
    cc_df.columns = [c.strip() for c in cc_df.columns]
    call_costs = []
    for _, row in cc_df.iterrows():
        call_costs.append({
            "age": str(row.get("age", "")).strip(),
            "product_type": str(row.get("ProductType", "")).strip(),
            "tech": str(row.get("Tech", "")).strip(),
            "year1": float(row.get("year1", 0) or 0),
            "year2": float(row.get("year2", 0) or 0),
            "year3": float(row.get("year3", 0) or 0),
            "call_cost": float(row.get("callCost", 150) or 150),
            "material_cost": float(row.get("MaterialCost", 20.13) or 20.13),
        })

    # --- Excluded models ---
    excluded_df = xl.parse("לא לביטוח_notuse")
    excluded_models = set()
    for _, row in excluded_df.iterrows():
        val = row.iloc[0]
        if pd.notna(val):
            excluded_models.add(str(val).strip().upper())

    # --- Existing contracts (not use — already contracted customers) ---
    try:
        contracts_df = xl.parse("Contract_notuse")
        contracts_df.columns = [c.strip() for c in contracts_df.columns]
        contracted_customers = set()
        for _, row in contracts_df.iterrows():
            cid = str(row.get("Customer ID", "") or row.iloc[0] or "").strip()
            if cid:
                contracted_customers.add(cid)
    except Exception:
        contracted_customers = set()

    return {
        "accounts": accounts,
        "products_catalog": products_catalog,
        "registered_products": registered_products,
        "customer_products": customer_products,
        "serial_tickets": serial_tickets,
        "contract_prices": contract_prices,
        "call_costs": call_costs,
        "excluded_models": excluded_models,
        "contracted_customers": contracted_customers,
    }
