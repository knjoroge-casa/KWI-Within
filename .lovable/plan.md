

# Add Bowel Movements + Perceived Temperature

Two small additions, plus a section rename.

## 1. Section 4 rename

Current: **"Body — Aches, Tension & Tenderness"**
New: **"Body — How it feels today"**

Short, plain English, naturally covers aches, tension, tenderness, and temperature. Keeps the warm tone and avoids a list-of-things title.

(Alternatives if you prefer: *"Body Signals"* / *"Body Check"* / *"Body Today"*. Going with **"Body — How it feels today"** unless you say otherwise.)

## 2. New field in Section 4: Perceived temperature

Placed after **Breast tenderness** (last in section, since it's a whole-body signal not localised).

- **Feeling temperature-wise** — Comfortable / Running cold / Running warm / Hot flushes / Sweaty / All over the place

Single-tap chips. Covers cold sensitivity, warmth, hot flashes, sweats, and the perimenopause "thermostat is broken" pattern in one question.

`LogBody` gains:
```ts
perceived_temp: 'comfortable' | 'cold' | 'warm' | 'hot_flushes' | 'sweaty' | 'erratic' | null
```

## 3. New field in Appetite & Digestion: Bowel movements

Placed after **Digestion** (natural pairing). Using everyday language — "How things moved" — instead of clinical terminology.

- **How things moved today** — Didn't go / Once, normal / A few times / Loose / Hard work / Urgent

Single tap. Captures frequency + consistency in one go without a Bristol-stool-chart vibe.

`LogAppetite` gains:
```ts
bowel_movements: 'none' | 'once_normal' | 'multiple' | 'loose' | 'hard' | 'urgent' | null
```

## Files to change

- `src/data/types.ts` — add `perceived_temp` to `LogBody`, add `bowel_movements` to `LogAppetite`.
- `src/pages/DailyLog.tsx` — rename Section 4 title, add Perceived temperature field at end of Body section, add Bowel movements field after Digestion in Appetite section, wire up two new state hooks.

No other sections, no placeholder data changes, no chart impacts.

