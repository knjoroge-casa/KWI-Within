# Insights — Wrap calendar in "Previous Thoughts" collapsible

Small UI tweak on the Insights page, Thoughts section.

## Change

Currently the month-grid calendar of past thought entries sits directly under this week's prompt card, always visible.

Wrap it in a collapsible card titled **"Previous Thoughts"** so it acts as a clear repository, not just a loose calendar. Collapsed by default — tap to expand and reveal the existing calendar (month nav + day grid + dot markers + tap-to-view sheet) exactly as it works today.

### Collapsed state
- Card with title **"Previous Thoughts"**
- Subtext: **"Tap to browse past entries"** (or hide if no past entries exist)
- Chevron on the right, matching the "This Week" / "This Month" / "Watch List" cards below

### Expanded state
- Calendar renders inside the card (same month navigation, day grid, entry dots, viewer sheet)

### Empty state
- If `pastThoughts.length === 0`, don't render the card at all (same as current behaviour)

## File

- `src/pages/DailyLog.tsx` — no changes
- `src/pages/Insights.tsx` — reuse the existing `CollapsibleCard` component already used in the "Within Kui" section. Add a `previousThoughts` key to the `openCards` state (default `false`). Move the calendar JSX inside `<CollapsibleCard title="Previous Thoughts" …>`.

No data, type, or styling system changes.
