"""The example company's knowledge base: every standard in the index has its document, every rule ID is in that document, the data the
documents describe is the data the checks use, and the numbers the documents quote are the numbers in the data."""

import json
import re
from pathlib import Path

from teamkit import mod

constants = mod("constants")
APP = constants.APP_ROOT
KB = APP / "knowledge" / "larkspur"
INDEX = json.loads((APP / "packs" / "larkspur" / "standards.json").read_text(encoding="utf-8"))
CJK = re.compile("[一-鿿]")


def data(name):
    return json.loads((KB / "data" / name).read_text(encoding="utf-8"))


def test_every_standard_in_the_index_has_its_document_and_every_rule_is_in_it():
    assert len(INDEX) == 13 and len({s["id"] for s in INDEX}) == 13
    for s in INDEX:
        doc = KB / s["doc"]
        assert doc.is_file(), (s["id"], s["doc"])
        text = doc.read_text(encoding="utf-8")
        assert s["title"].split(" (")[0].lower() in text.lower() or s["title"].lower() in text.lower(), s["id"]
        for rule in s.get("rules", []):
            assert re.search(rf"\b{re.escape(rule)}\b", text), (s["id"], rule)
        assert s["kind"] in ("standard", "data") and s["owner"] and s["keywords"], s["id"]


def test_every_document_in_the_knowledge_base_is_in_the_index_and_nothing_is_left_in_chinese():
    named = {s["doc"] for s in INDEX}
    docs = {str(p.relative_to(KB)) for p in KB.rglob("*.md") if p.name != "README.md" and not p.name.startswith("00-")}
    assert docs == named, (sorted(docs - named), sorted(named - docs))
    mine = [APP / "team" / "team-promo.json", APP / "team" / "roster-larkspur.json", APP / "team" / "task_template-promo.md"]
    for path in list(KB.rglob("*")) + list((APP / "packs").rglob("*")) + list((APP / "starters").rglob("*")) + list((APP / "demo").rglob("*")) + mine:
        if path.is_file() and path.suffix in (".md", ".json", ".js", ".cjs", ".css", ".html", ".svg"):
            assert not CJK.search(path.read_text(encoding="utf-8")), path


def test_the_data_the_checks_use_is_the_data_the_knowledge_base_documents_point_to():
    pairs = {"mall-products.json": "products.json", "mall-orders.json": "orders.json", "mall-campaign.json": "campaign.json"}
    for kb_name, check_name in pairs.items():
        want = (KB / "data" / kb_name).read_text(encoding="utf-8")
        assert (APP / "packs" / "larkspur-promo" / "tests" / "enterprise" / "data" / check_name).read_text(encoding="utf-8") == want, check_name
    ref = APP / "packs" / "larkspur-promo" / "_reference" / "server"
    assert (ref / "data" / "products.json").read_text(encoding="utf-8") == (KB / "data" / "mall-products.json").read_text(encoding="utf-8")
    assert (ref / "data" / "orders.json").read_text(encoding="utf-8") == (KB / "data" / "mall-orders.json").read_text(encoding="utf-8")
    assert (ref / "config" / "campaign.json").read_text(encoding="utf-8") == (KB / "data" / "mall-campaign.json").read_text(encoding="utf-8")
    for md in (KB / "data").glob("*.md"):  # the JSON file a document names exists
        for name in re.findall(r"data/([\w-]+\.json)", md.read_text(encoding="utf-8")):
            assert (KB / "data" / name).is_file(), (md.name, name)


def test_the_numbers_the_documents_quote_are_the_numbers_in_the_data():
    people = data("employees.json")
    text = (KB / "data" / "employee-directory.md").read_text(encoding="utf-8")
    active = [p for p in people if p["status"] == "Active" and p["type"] == "Employee"]
    contractors = [p for p in people if p["type"] == "Contractor"]
    departed = [p for p in people if p["status"] == "Departed"]
    assert (len(people), len(active), len(contractors), len(departed)) == (120, 106, 8, 6)
    assert "has 120 people" in text and "106 active employees, 8 contractors and 6 who have departed" in text
    for row in re.findall(r"^\| (LK\d+) \| ([^|]+) \| [^|]+ \| [^|]+ \| (LK\d+|—) \| (\d{4}-\d\d-\d\d) \| (\w+) \| (\w+) \| \*\*\*-\*\*\*-(\d{4}) \|$", text, re.M):
        p = next(x for x in people if x["id"] == row[0])
        assert (p["name"], p["manager"] or "—", p["joined"], p["status"], p["type"], p["phone"][-4:]) == (row[1].strip(), row[2], row[3], row[4], row[5], row[6])
    assert not re.search(r"(?<!\d)\d{3}-555-\d{4}", text), "the document must show masked phone numbers"
    orders = data("mall-orders.json")
    assert (min(o["date"] for o in orders), max(o["date"] for o in orders)) == ("2026-09-28", "2026-11-26")
    doc = (KB / "data" / "storefront-products-and-orders.md").read_text(encoding="utf-8")
    assert "2026-09-28 to 2026-11-26" in doc and "Oct 28 to Nov 26" in doc
    weak = data("weak-passwords.json")
    assert len(weak) == 45 and f"{len(weak)} entries" in (KB / "data" / "common-weak-passwords.md").read_text(encoding="utf-8")
    assert sum(p["count"] for p in data("prizes.json")) == 20


def test_the_story_the_checks_rely_on_holds_in_the_data():
    """The plan fails the check for two items and for the payout; the person's change at the gate fixes both."""
    import subprocess
    import sys
    out = subprocess.run([sys.executable, str(APP / "scripts" / "gen_larkspur_data.py"), "--check"], capture_output=True, text=True, check=False)
    assert out.returncode == 0, out.stderr or out.stdout
    info = json.loads(out.stdout.strip().splitlines()[0])
    assert info["amount"] > 20000 >= info["fixed_amount"] and len(info["moved"]) >= 3, info
    plan = (KB / "data" / "campaign-plan.md").read_text(encoding="utf-8")
    assert "Nov 20 to Nov 26" in plan and "Nov 13 to Nov 26" in plan and "Oct 28 to Nov 26" in plan
    assert f"${info['amount']:,}" in (KB / "42-price-adjustment-guarantee-rules.md").read_text(encoding="utf-8")
