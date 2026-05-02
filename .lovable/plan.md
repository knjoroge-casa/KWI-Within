## Recolor confidence pills — plum scale

In `src/pages/Insights.tsx` (lines 44–48), update `confidenceConfig` so the three pills sit on a single-hue plum intensity scale:

- `noticing` → `bg-primary/10 text-primary/70`
- `watching` → `bg-primary/20 text-primary`
- `strong` → `bg-primary text-primary-foreground`

Labels stay the same. No other changes.