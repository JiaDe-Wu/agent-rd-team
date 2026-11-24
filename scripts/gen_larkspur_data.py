#!/usr/bin/env python3
"""Generate the example company's data: Larkspur Outfitters (fictional).

Deterministic: the same script always writes the same files, so a diff shows a real change. Writes

  knowledge/larkspur/data/*.json            the data the knowledge base documents point to
  packs/larkspur-promo/tests/enterprise/data/{products,orders,campaign}.json   the checks' copy
  packs/larkspur-promo/_reference/server/{data/{products,orders}.json,config/campaign.json}

and checks the story the checks rely on (see `verify`). Run from the repository root:

    python3 scripts/gen_larkspur_data.py            # write the files
    python3 scripts/gen_larkspur_data.py --check    # only check the story
"""
import json
import os
import sys
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
START = date(2026, 11, 27)          # Black Friday; all dates are US Eastern Time
LIMIT = 20000                       # PP-2: payouts above this need CFO approval (dollars)

# sku, name, category, price, cost, stock, priceProtect, pct, fullReduction
PRODUCTS = [
    ("TENT4", "Ridgeline 4-Person Tent", "Tents", 599, 410, 800, True, 80, True),
    ("TENT2", "Ridgeline 2-Person Tent", "Tents", 379, 265, 1200, False, 85, True),
    ("TENT6", "Summit 6-Person Basecamp Tent", "Tents", 999, 690, 300, False, 85, True),
    ("BAG20", "Alpine 20F Down Sleeping Bag", "Sleeping Bags", 349, 240, 1500, True, 85, True),
    ("BAG0", "Alpine 0F Down Sleeping Bag", "Sleeping Bags", 529, 365, 600, False, 85, True),
    ("PACK65", "Trailhead 65L Backpack", "Packs", 289, 200, 500, False, 85, True),
    ("PACK40", "Trailhead 40L Backpack", "Packs", 159, 110, 900, False, 90, True),
    ("BOOT", "Granite Waterproof Hiking Boots", "Footwear", 169, 115, 900, False, 85, True),
    ("MBOOT", "Granite Mountaineering Boots", "Footwear", 429, 295, 300, False, 85, True),
    ("STOVE", "Basecamp Two-Burner Stove", "Camp Kitchen", 189, 128, 400, False, 85, True),
    ("COOK", "Basecamp Nesting Cook Set", "Camp Kitchen", 179, 121, 500, False, 85, True),
    ("JACKET", "Glacier Down Jacket", "Apparel", 399, 260, 1000, True, 70, True),
    ("RAIN", "Trail Rain Shell", "Apparel", 199, 131, 1200, True, 85, True),
    ("BASE", "Merino Base Layer", "Apparel", 119, 78, 800, False, 85, True),
    ("GPS", "Orbit GPS Watch", "Electronics", 449, 348, 2000, False, 95, False),
    ("MSG", "Orbit Satellite Messenger", "Electronics", 299, 222, 1500, False, 90, False),
    ("LAMP", "Beacon Rechargeable Headlamp", "Electronics", 79, 47, 3000, True, 85, True),
    ("SOLAR", "Orbit Solar Charger", "Electronics", 149, 97, 2000, True, 85, True),
    ("BTL", "Trailside Insulated Bottle Set", "Camp Kitchen", 59, 35, 2500, True, 80, True),
    ("FILT", "Camp Water Filter", "Camp Kitchen", 129, 84, 700, False, 85, True),
]
# expected orders per day at the middle of the 60 days
RATE = {"TENT4": 6.0, "TENT2": 1.75, "TENT6": 1.7, "BAG20": 0.55, "BAG0": 1.6, "PACK65": 1.5, "PACK40": 1.5,
        "BOOT": 1.9, "MBOOT": 2.1, "STOVE": 1.25, "COOK": 1.7, "JACKET": 3.4, "RAIN": 1.4, "BASE": 2.1,
        "GPS": 1.6, "MSG": 1.95, "LAMP": 1.7, "SOLAR": 1.9, "BTL": 1.7, "FILT": 1.3}
DIPS = [("BAG20", date(2026, 11, 23), 299, 2), ("MBOOT", date(2026, 11, 22), 399, 3), ("BASE", date(2026, 11, 24), 109, 5)]
FIXED_PCT = {"TENT4": 90, "JACKET": 80}   # what the person at the release gate changes


class Lcg:
    """A tiny deterministic random source (no dependency on the Python version's `random`)."""

    def __init__(self, seed):
        self.x = seed

    def next(self):
        self.x = (self.x * 6364136223846793005 + 1442695040888963407) % (1 << 64)
        return (self.x >> 33) / float(1 << 31)


def products():
    return [{"sku": s, "name": n, "category": c, "price": p, "cost": k, "stock": st, "priceProtect": pp}
            for s, n, c, p, k, st, pp, _pct, _fr in PRODUCTS]


def campaign():
    return {
        "name": "Larkspur Outfitters Official Store · Black Friday to Cyber Monday",
        "start": "2026-11-27T00:00:00-05:00",
        "end": "2026-11-30T23:59:59-05:00",
        "fullReduction": {"every": 300, "off": 30, "withDiscount": True, "withCoupon": False},
        "items": [{"sku": s, "pct": pct, "fullReduction": fr, "linePriceInput": p}
                  for s, _n, _c, p, _k, _st, _pp, pct, fr in PRODUCTS],
    }


def orders():
    rnd = Lcg(20261127)
    price = {p[0]: p[3] for p in PRODUCTS}
    out = []
    first = START - timedelta(days=60)
    for d in range(60):
        day = first + timedelta(days=d)
        ramp = 0.62 + 0.76 * d / 59.0            # volume grows towards the sale
        weekend = 1.18 if day.weekday() >= 5 else 1.0
        for sku in [p[0] for p in PRODUCTS]:
            expect = RATE[sku] * ramp * weekend
            n = int(expect) + (1 if rnd.next() < expect - int(expect) else 0)
            for _ in range(n):
                qty = 2 if price[sku] < 100 and rnd.next() < 0.18 else 1
                status = "Returned" if rnd.next() < 0.035 else "Completed"
                out.append({"sku": sku, "paid": price[sku], "qty": qty, "date": day.isoformat(), "status": status})
    for sku, day, paid, n in DIPS:                 # the 7 days before the sale: some items sold lower (PRC-1)
        same = [o for o in out if o["sku"] == sku and o["date"] == day.isoformat() and o["status"] == "Completed"]
        for o in same[:n]:
            o["paid"] = paid
        for _ in range(n - len(same[:n])):
            out.append({"sku": sku, "paid": paid, "qty": 1, "date": day.isoformat(), "status": "Completed"})
    out.sort(key=lambda o: (o["date"], [p[0] for p in PRODUCTS].index(o["sku"])))
    for i, o in enumerate(out, 1):
        o["id"] = "LK%06d" % i
    return [{"id": o["id"], "sku": o["sku"], "paid": o["paid"], "qty": o["qty"], "date": o["date"], "status": o["status"]} for o in out]


# ---- the reference algorithm (the same as packs/larkspur-promo/tests/enterprise/_lib.js) ----

def day_before(n):
    return (START - timedelta(days=n)).isoformat()


def ref_check(prod, orders_, config):
    by = {p["sku"]: p for p in prod}

    def done(o, a, b):
        return o["status"] == "Completed" and a <= o["date"] <= b

    def line(sku):
        seen = [o["paid"] for o in orders_ if o["sku"] == sku and done(o, day_before(7), day_before(1))]
        return min(seen) if seen else by[sku]["price"]
    items = []
    for i in config["items"]:
        p = by[i["sku"]]
        final = (p["price"] * i["pct"] + 50) // 100
        lowest = (final * 9 + 5) // 10 if i["fullReduction"] else final
        items.append(dict(sku=i["sku"], final=final, lowest=lowest, ok=lowest * 100 >= p["cost"] * 108, line=line(i["sku"]), price=p["price"]))
    fin = {i["sku"]: i["final"] for i in items}
    amount = orders_n = 0
    for o in orders_:
        if o["sku"] in fin and done(o, day_before(14), day_before(1)) and by[o["sku"]]["priceProtect"] and o["paid"] > fin[o["sku"]]:
            amount += (o["paid"] - fin[o["sku"]]) * o["qty"]
            orders_n += 1
    return items, amount, orders_n


def verify(prod, orders_, config):
    items, amount, n = ref_check(prod, orders_, config)
    low = sorted(i["sku"] for i in items if not i["ok"])
    assert low == ["JACKET", "TENT4"], low
    assert amount > LIMIT, amount
    fixed = json.loads(json.dumps(config))
    for i in fixed["items"]:
        i["pct"] = FIXED_PCT.get(i["sku"], i["pct"])
    f_items, f_amount, f_n = ref_check(prod, orders_, fixed)
    assert all(i["ok"] for i in f_items), [i for i in f_items if not i["ok"]]
    assert f_amount <= LIMIT, f_amount
    moved = [i["sku"] for i in items if i["line"] != i["price"]]
    assert len(moved) >= 3, moved
    return {"orders": len(orders_), "amount": amount, "payout_orders": n, "fixed_amount": f_amount, "moved": moved,
            "risk": amount - f_amount}


def write(rel, data):
    """Orders and other long lists: one record per line; everything else indented."""
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if isinstance(data, list) and len(data) > 40:
            f.write("[\n" + ",\n".join(" " + json.dumps(x, ensure_ascii=False) for x in data) + "\n]\n")
        else:
            json.dump(data, f, ensure_ascii=False, indent=1)
            f.write("\n")


def main():
    prod, ords, cfg = products(), orders(), campaign()
    info = verify(prod, ords, cfg)
    sys.stdout.write(json.dumps(info) + "\n")
    if "--check" in sys.argv:        # only verify the story; write nothing
        return
    for rel in ("packs/larkspur-promo/tests/enterprise/data", "knowledge/larkspur/data"):
        write(rel + "/mall-products.json" if rel.startswith("knowledge") else rel + "/products.json", prod)
        write(rel + "/mall-orders.json" if rel.startswith("knowledge") else rel + "/orders.json", ords)
        write(rel + "/mall-campaign.json" if rel.startswith("knowledge") else rel + "/campaign.json", cfg)
    ref = "packs/larkspur-promo/_reference/server"
    write(ref + "/data/products.json", prod)
    write(ref + "/data/orders.json", ords)
    write(ref + "/config/campaign.json", cfg)
    import gen_larkspur_people  # noqa: E402  (employees, prizes and weak passwords: scripts/gen_larkspur_people.py)
    gen_larkspur_people.main(ROOT, write)


if __name__ == "__main__":
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    main()
