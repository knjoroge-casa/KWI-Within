## Reformat SignIn page

Single-file change to `src/pages/SignIn.tsx`.

### Desktop (lg+)
- **Left column:** sign in form, vertically centered with generous whitespace. Contains "Welcome back." heading, subtext, email/password fields, "Forgot password?", primary Sign in button, "Create an account" footer.
- **Right column:** visual panel using the existing `VisualPanel` (KWI palette: plum/accent organic blurred shapes on cream gradient with grain overlay). Centerpiece: prominent KWI logo (~240–280px) with "KWI Within" eyebrow caption beneath.
- Remove `order-first` so visual sits on the right.

### Mobile
- Top banner keeps the coloured `VisualPanel` background with the KWI logo, but **logo enlarged** (from h-20 to ~h-28/h-32) and banner height bumped (h-44 → h-52) for breathing room.
- **Remove the serif quote entirely** from the form column.

### Cleanup
- Delete the `QUOTE` constant and its JSX block in the form column.
- No token, dependency, or routing changes.
