# Lumina OH Energy Engine Specification

The energy engine calculates a user's energy profile based on selected cards.

---

# Inputs

Selected cards list.

Each card contains:

wood
fire
earth
metal
water

---

# Calculation Flow

1. Retrieve card values from database
2. Sum element values
3. Normalize values
4. Detect dominant element
5. Detect weak element
6. Generate energy profile

---

# Output Structure

Energy Report JSON

{
  wood: number,
  fire: number,
  earth: number,
  metal: number,
  water: number,
  dominant_element: string,
  weak_element: string,
  balance_score: number
}

---

# Balance Score

Balance score represents how evenly the five elements are distributed.

Score range:

0 – 100

Higher score indicates better balance.

---

# Deterministic Rule

The engine must always produce the same output for the same input.

No randomness is allowed.