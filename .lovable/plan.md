

# Update Section 4: Body — Aches & Tension

Small revision to the agreed Daily Log spec.

## Changes

**Section 4 title** — rename from *"Body — Aches & Tension"* to **"Body — Aches, Tension & Tenderness"** so the new field has a natural home.

**New field: Breast tenderness** — added to section 4, placed after the cycle-adjacent body signals (pelvic + lower back) since it tracks similarly across the cycle.

- **Breast tenderness** — None / Mild / Noticeable / Painful to touch

## Updated Section 4 — Body — Aches, Tension & Tenderness

*"What's your body saying?" — Pelvic, lower back, and breast tenderness appear for everyone.*

- **Headache or migraine** — None / Mild headache / Significant headache / Migraine
  - *(if any)* **Where?** — Forehead / Temples / Back of head / Behind eyes / Whole head
- **Joint pain** — None / Mild / Noticeable / Difficult to ignore
  - *(if any)* **Where?** (multi-tap) — Shoulders / Elbows / Wrists / Hips / Knees / Ankles / Lower back / Upper back / Neck
- **Muscle aches** — None / Mild / Noticeable
- **Morning stiffness** — None / A little, loosened quickly / Took a while / Still stiff by midday
- **Pelvic area** — No pain / Mild pressure / Noticeable pain / Significant pain
- **Lower back** — Fine / Mild / Noticeable / Bad today
- **Breast tenderness** — None / Mild / Noticeable / Painful to touch

## Type impact

`LogBody` interface (to be added in `src/data/types.ts`) gains one field:
```ts
breast_tenderness: 'none' | 'mild' | 'noticeable' | 'painful'
```

Everything else in the previously approved spec stands.

