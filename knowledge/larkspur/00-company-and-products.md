---
title: Larkspur Outfitters: company and products
tags: [company, products, online store, outdoor gear]
---

# Larkspur Outfitters: company and products

Larkspur Outfitters is a fictional online retailer of outdoor gear: tents, sleeping bags, packs, footwear, camp kitchen, apparel and electronics. It has about 3,000 employees in the US and Canada; headquarters has about 120 people in 9 departments (R&D Center, Product, Design, Marketing, Sales, Customer Success, Finance, People Operations, Facilities).

Everything in this knowledge base is made up for the example. The rules are modelled on what a real retailer writes down, so you can see how a company's standards constrain what an agent team produces.

## Products

| Product | What it is | Where the code is |
|---|---|---|
| Official store | The online store that sells Larkspur's own gear; Operations configures sales (Black Friday to Cyber Monday, Spring Gear-Up) in a back office | One campaign repository per sale, started from the company's store campaign template |
| Event pages | Pages and big-screen displays for the company raffle and internal events | One repository per event, started from the company's web template |
| Private IM | Internal chat: web and Android, with contacts and a feed. The brand mascot is Pip | `im/` repository: `web/` (React + TypeScript), `android/`, `server/` (Go) |

## Who decides what

| Topic | Owner | Document |
|---|---|---|
| Brand (colours, fonts, mascot) | Design | Brand Standard |
| Account and password security | Security (R&D Center) | Account Security Standard |
| How personal data is displayed | Legal + Security | Personal Data Display Standard |
| How front ends are written | R&D Center | Frontend Engineering Standard |
| Company raffle | People Operations | Company Raffle Rules |
| Pricing and promotion compliance | Legal + Pricing Compliance | Pricing and Promotion Compliance Standard |
| Margin floor and pricing | Finance | Margin and Pricing Rules |
| Price-adjustment guarantee | Finance + Customer Success | Price-Adjustment Guarantee Rules |

## Data

The data documents are in the `data/` folder: employee directory, raffle prize list, common weak passwords, store products and orders, and the Black Friday campaign plan. The full data is JSON, in `~/workplace/knowledge/larkspur/data/`; each document names its file.

All dates and times are US Eastern Time. All prices are US dollars, whole dollars.
