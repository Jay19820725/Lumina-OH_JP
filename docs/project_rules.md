# Lumina OH — Project Rules

## Project Overview

Lumina OH is a spiritual energy analysis platform based on a card system.

The platform contains exactly **88 cards**.

Each card includes:

- one visual image card
- one text card
- five element energy values

Users perform an energy test by selecting cards and receive a personalized **Five Element Energy Report**.

---

# Core Product Modules

1. Card System
2. Energy Analysis Engine
3. Energy Report Generator
4. User Account System
5. History & Session Tracking

---

# Technology Stack

Frontend
- Next.js 14
- Typescript
- TailwindCSS v4

Backend
- Firebase

Database
- Firestore

Hosting
- Vercel

---

# Data Constraints

The card system contains **exactly 88 cards**.

Card data must always come from:

cards.csv

The CSV file is the **single source of truth**.

Do not create card data manually in code.

---

# AI Development Rules

When generating code:

- Do not invent new features.
- Do not create additional card fields.
- Follow the CSV structure strictly.
- Follow modular architecture.
- Avoid hardcoded card values.

If information is missing, request clarification instead of guessing.

---

# System Philosophy

Lumina OH is not a gaming platform.

It is a **spiritual reflection and energy awareness tool**.

The tone of the product must feel:

- calm
- elegant
- reflective
- emotionally safe