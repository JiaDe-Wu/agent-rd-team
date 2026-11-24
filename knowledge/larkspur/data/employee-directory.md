---
title: Employee directory
tags: [data, employees, directory, org chart, reporting line, contacts]
---

# Employee directory

Larkspur Outfitters headquarters has 120 people (the all-hands event is the headquarters event): 106 active employees, 8 contractors and 6 who have departed (export from People Operations).

**The full data is one JSON file: `~/workplace/knowledge/larkspur/data/employees.json`** (an array, one entry per person; fields: `id` employee ID, `name`, `dept` department, `title`, `manager` the manager's employee ID, `joined` hire date, `status` Active or Departed, `type` Employee or Contractor, `phone`). When you write code, copy this file into the project; do not retype it or change it.

**Reporting lines**: each department has one head (`manager` is `null`) and the people in it report to the head. R&D Center and Sales are large and each has two team leads (Engineering Manager, Regional Sales Manager) who report to the head; their team members report to a lead. Contractors have managers too, but are never a head or a lead. Departed employees keep the title and manager they had.

A phone number is personal data: how to display it is in the Personal Data Display Standard PII-1 to PII-4; who can win is in the Company Raffle Rules RULE-1. All names and phone numbers here are made up (the 555-01xx range is reserved for fiction).

The first 10 entries (phone numbers masked under PII-1):

| ID | Name | Department | Title | Manager | Hired | Status | Type | Phone |
|---|---|---|---|---|---|---|---|---|
| LK190108 | Noah Haddad | R&D Center | VP of Engineering | — | 2019-06-14 | Active | Employee | ***-***-0117 |
| LK220116 | Hannah Mbeki | R&D Center | Software Engineer | LK230172 | 2022-11-27 | Active | Employee | ***-***-0134 |
| LK250124 | Kenji Alvarez | R&D Center | Senior Software Engineer | LK210140 | 2025-04-12 | Active | Employee | ***-***-0151 |
| LK180132 | Imani Ferraro | R&D Center | QA Engineer | LK230172 | 2018-09-25 | Active | Employee | ***-***-0168 |
| LK210140 | Dmitri Bergstrom | R&D Center | Engineering Manager | LK190108 | 2021-02-10 | Active | Employee | ***-***-0185 |
| LK240148 | Aisha Moreau | R&D Center | Software Engineer | LK230172 | 2024-07-23 | Active | Contractor | ***-***-0102 |
| LK170156 | Lucas Novak | R&D Center | Senior Software Engineer | LK210140 | 2017-12-08 | Active | Employee | ***-***-0119 |
| LK200164 | Sofia Vasquez | R&D Center | QA Engineer | LK230172 | 2020-05-21 | Active | Employee | ***-***-0136 |
| LK230172 | Victor Kowalski | R&D Center | Engineering Manager | LK190108 | 2023-10-06 | Active | Employee | ***-***-0153 |
| LK160180 | Tessa Mbeki | R&D Center | Software Engineer | LK230172 | 2016-03-19 | Departed | Employee | ***-***-0170 |
