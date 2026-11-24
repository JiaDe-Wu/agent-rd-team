"""Employees, raffle prizes and weak passwords of the example company (fictional, deterministic).

Used by gen_larkspur_data.py. Every phone number is in the reserved fictional 555-01xx range."""
FIRST = ["Avery", "Jordan", "Priya", "Marcus", "Elena", "Tomas", "Aisha", "Noah", "Mei", "Samuel", "Camila", "Owen",
         "Fatima", "Lucas", "Hannah", "Diego", "Grace", "Rohan", "Nadia", "Ethan", "Sofia", "Kenji", "Maya", "Isaac",
         "Leah", "Andre", "Chloe", "Victor", "Imani", "Felix", "Ruth", "Omar", "Zoe", "Hugo", "Tessa", "Dmitri"]
LAST = ["Brooks", "Nguyen", "Patel", "Alvarez", "Okafor", "Lindqvist", "Hart", "Moreau", "Tanaka", "Reyes", "Kowalski",
        "Haddad", "Sullivan", "Park", "Ferraro", "Adeyemi", "Whitfield", "Castillo", "Novak", "Ibarra", "Chen", "Doyle",
        "Mbeki", "Larsen", "Quinn", "Salazar", "Bergstrom", "Osei", "Rowan", "Vasquez"]
AREA = ["415", "212", "312", "206", "303", "503"]
DEPTS = [  # name, head title, size, member titles
    ("R&D Center", "VP of Engineering", 26, ["Software Engineer", "Senior Software Engineer", "QA Engineer", "DevOps Engineer"]),
    ("Product", "VP of Product", 10, ["Product Manager", "Product Analyst"]),
    ("Design", "Head of Design", 9, ["Product Designer", "Brand Designer"]),
    ("Marketing", "VP of Marketing", 12, ["Marketing Manager", "Content Strategist"]),
    ("Sales", "VP of Sales", 22, ["Account Executive", "Sales Associate", "Retail Partnerships Lead"]),
    ("Customer Success", "Head of Customer Success", 14, ["Support Specialist", "Customer Success Manager"]),
    ("Finance", "CFO", 9, ["Financial Analyst", "Accountant"]),
    ("People Operations", "Head of People Operations", 8, ["HR Generalist", "Recruiter"]),
    ("Facilities", "Head of Facilities", 10, ["Facilities Coordinator", "Office Administrator"]),
]
LEADS = {"R&D Center": ("Engineering Manager", 2), "Sales": ("Regional Sales Manager", 2)}


def employees():
    rows = []
    n = 0
    seq = 0
    for dept, head_title, size, titles in DEPTS:
        people = []
        for i in range(size):
            seq += 1
            n += 1
            first, last = FIRST[(seq * 7) % len(FIRST)], LAST[(seq * 11 + seq // 5) % len(LAST)]
            year = 2016 + (seq * 3) % 10
            joined = "%d-%02d-%02d" % (year, 1 + (seq * 5) % 12, 1 + (seq * 13) % 28)
            people.append({"id": "LK%02d%04d" % (year % 100, 100 + seq * 7 % 900 + n), "name": first + " " + last, "dept": dept,
                           "title": head_title if i == 0 else titles[(i - 1) % len(titles)], "manager": None, "joined": joined,
                           "status": "Active", "type": "Employee",
                           "phone": "%s-555-%04d" % (AREA[seq % len(AREA)], 100 + (seq * 17) % 100)})
        head = people[0]
        lead_title, lead_n = LEADS.get(dept, (None, 0))
        leads = []
        for p in people[1:]:
            if lead_title and len(leads) < lead_n and p["title"] != lead_title and (len(leads) + 1) * 4 == people.index(p) - 0:
                p["title"] = lead_title
                leads.append(p)
        for p in people[1:]:
            if p in leads:
                p["manager"] = head["id"]
            elif leads:
                p["manager"] = leads[people.index(p) % len(leads)]["id"]
            else:
                p["manager"] = head["id"]
        rows.extend(people)
    # 8 contractors (never a head or a lead), 6 departed (keep their last title and manager)
    heads = {r["id"] for r in rows if r["manager"] is None}
    lead_ids = {r["manager"] for r in rows if r["manager"]}
    plain = [r for r in rows if r["id"] not in heads and r["id"] not in lead_ids]
    for r in plain[3:40:4][:8]:
        r["type"] = "Contractor"
    gone = [r for r in plain if r["type"] == "Employee"][5:80:13][:6]
    for r in gone:
        r["status"] = "Departed"
    ids = [r["id"] for r in rows]
    assert len(ids) == len(set(ids)) == 120, (len(ids), len(set(ids)))
    return rows


def prizes():
    return [{"id": "P1", "level": "Third prize", "name": "Larkspur camp mug gift box", "count": 12, "order": 1},
            {"id": "P2", "level": "Second prize", "name": "Beacon Rechargeable Headlamp", "count": 5, "order": 2},
            {"id": "P3", "level": "First prize", "name": "Orbit GPS Watch", "count": 2, "order": 3},
            {"id": "P4", "level": "Grand prize", "name": "Ridgeline 4-Person Tent with Alpine 0F Sleeping Bag", "count": 1, "order": 4}]


def weak_passwords():
    base = ["password", "password1", "passw0rd", "qwerty", "qwerty123", "qwer1234", "asdf1234", "zxcv1234", "abc123",
            "abc12345", "abcd1234", "a1234567", "a12345678", "aa123456", "aa112233", "12345678", "123456789", "1234567890",
            "11111111", "00000000", "12341234", "123123123", "iloveyou", "welcome1", "welcome123", "letmein1", "admin123",
            "admin1234", "changeme", "changeme1", "football1", "baseball1", "monkey123", "dragon123", "sunshine1",
            "princess1", "superman1", "trustno1", "larkspur123", "larkspur2026", "outfitters1", "campfire1",
            "hikingboots1", "basecamp123", "summit2026"]
    assert len(base) == 45
    return base


def main(root, write):
    write("knowledge/larkspur/data/employees.json", employees())
    write("knowledge/larkspur/data/prizes.json", prizes())
    write("knowledge/larkspur/data/weak-passwords.json", weak_passwords())
