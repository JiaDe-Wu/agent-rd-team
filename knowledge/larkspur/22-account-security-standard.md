---
title: Account Security Standard (Larkspur Outfitters)
tags: [standard, security, password, account, sign-up, sign-in]
---

# Account Security Standard

Written by Security. Applies to Private IM and every company system with a sign-in. Rule IDs are ACC-n; code and tests cite the IDs.

| ID | Rule | Why | Example |
|---|---|---|---|
| ACC-1 | When a password is set or reset it has **at least 8 characters, and both letters and digits**. | A 6-digit password falls to a guess in seconds | Passes: `Tent2026x`. Fails: `12345678`, `campfire` |
| ACC-2 | **No common weak passwords.** Security maintains the list (document: Common Weak Passwords). The comparison ignores case. | Credential-stuffing attacks try these first | `Welcome1` fails because `welcome1` is on the list |
| ACC-3 | The password **must not contain the last 6 digits of the person's phone number**. | The first thing an acquaintance guesses | Phone `415-555-0134` (digits `4155550134`): `Pw550134!` fails |
| ACC-4 | The page **gives feedback as the person types**: a strength (weak / medium / strong) and the rules not yet met. The form cannot be submitted while ACC-1 to ACC-3 are not met. | People learn how to fix it now, not after a failed submit | A strength meter and a list "needs a digit" appear while typing |
| ACC-5 | Passwords **never go to logs or local storage**: no `console.log` of a password, nothing written to `localStorage` or `sessionStorage`. | Prevents leaks | Fails: `localStorage.setItem('pw', value)` |
| ACC-6 | **The server checks too.** Every endpoint that sets or changes a password (sign-up, reset, change after sign-in, admin create user and reset) applies ACC-1 to ACC-3 again and rejects a bad one with a one-line message that matches the page's wording. The old "at least 6 characters" rule is gone. A rule added to a page is added on the server. | Page checks can be bypassed: calling the API directly sets a weak password | `POST /api/users` with password `abc123` returns `400` and "Use at least 8 characters with letters and digits" |

Strength (ACC-4): failing any of ACC-1 to ACC-3 is **weak**. Meeting all three but with fewer than 12 characters, or with only two character classes (letters and digits), is **medium**. Meeting all three with 12 or more characters and at least three of upper case, lower case, digits and symbols is **strong**.
