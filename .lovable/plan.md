# Daily Log — Small Copy & Default-State Tweaks

Four light edits to `src/pages/DailyLog.tsx`.

## Changes

1. **Section 4 title** — "Body — How it feels today" → **"Body Check** — How it feels today**"**
2. **Temperature field label** — "Feeling temperature-wise" → **"Hot or not?"**
3. **Bottom action** — "+ Track something else today" → **"Add more details"**
4. **Default open state** — all sections collapsed on page load (currently Energy, Sleep, Mood are open by default). User taps to open whatever they want to log.

## Files

- `src/pages/DailyLog.tsx` — three string changes + update the `LogSection`/`Collapsible` `defaultOpen` props (or initial state) so every section starts closed.

No type changes, no data changes, no other sections affected.