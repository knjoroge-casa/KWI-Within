## Recolor "For your doctor" card — Insights page

Currently the card uses an amber palette (`bg-amber-50`, `border-amber-200`, `text-amber-900/800`, button `bg-amber-700`). It clashes with the rest of the app. Re-skin it using the project's primary color (deep plum — same family as the logo and the floating Ask KWI chat icon).

### Change

In `src/pages/Insights.tsx` (the section starting at line 661), swap the amber utility classes for theme tokens tied to `--primary`:

- Container: `bg-primary/5 border border-primary/20` (soft plum tint, consistent with other cards on the page)
- Heading: `text-primary` (deep plum, matches logo)
- Body copy: `text-foreground/80` (readable, on-brand)
- Button: keep default `Button` styling (already uses `bg-primary` with `text-primary-foreground` and a proper hover state) — remove the amber override classes

### Result

The card sits in the same plum family as the logo and the Ask KWI floating button, while the CTA button matches every other primary action in the app. No new tokens, no other files touched.