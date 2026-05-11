## Swap logo and quote on SignIn page

Rework `src/pages/SignIn.tsx` so the KWI logo lives on the coloured visual panel (prominent) and the quote sits in the whitespace alongside the form.

### Desktop (lg+)

**Left column (form, white space):**
- Remove the small logo above the heading.
- Keep "Welcome back." + "Sign in to pick up where you left off." + form.
- Add the new quote in serif italic, positioned with breathing room below the form (or above the heading — see Q below). Smaller, restrained — not the hero.

**Right column (coloured panel):**
- Replace the quote block with a large, prominent KWI logo centered on the organic-shape background.
- Logo size ~220–260px wide, with the "KWI Within" eyebrow caption beneath it.
- Keep the existing gradient + blurred plum/accent shapes + grain overlay.

### Mobile

- Top banner becomes the logo on the coloured background (replaces the quote there).
- Quote moves into the form column as a small serif line near the bottom (under the "Create an account" link) so the white space carries it.

### Copy change

Quote everywhere becomes:
> "Tracking isn't about control. It's about understanding."

### Technical notes

- Single-file change: `src/pages/SignIn.tsx`.
- Update the `QUOTE` constant.
- Swap the JSX inside the visual column and the form column / mobile banner.
- No new dependencies, no token changes.
