## SignIn page for KWI Within

Create `src/pages/SignIn.tsx` and wire it into the router at `/signin`. No backend — submissions log to console.

### Layout

Two-column on `lg+`, single column below.

```
┌──────────────────────┬───────────────────────┐
│  Form column         │  Visual column        │
│  (centered, max-w-sm)│  (organic shapes      │
│                      │   + serif quote       │
│  [Logo]              │   overlay)            │
│  Welcome back.       │                       │
│  Sign in to pick…    │                       │
│  [Email]             │                       │
│  [Password]          │                       │
│       Forgot pwd? →  │                       │
│  [   Sign in    ]    │                       │
│  New here? Create →  │                       │
└──────────────────────┴───────────────────────┘
```

Mobile: visual collapses to a ~140px top banner with a soft gradient + small quote; form stacks below.

### Visual column choice

Go with **abstract organic shapes in the KWI palette + a serif quote overlaid**. This best matches the existing warm, grounded feel and reuses our token system (no new image assets to source).

- Background: soft gradient using `--background` → `--secondary` → `--muted`
- 2–3 large blurred plum/forest blobs (`bg-primary/20`, `bg-accent/15`) positioned absolutely with `blur-3xl`
- Centered serif pull-quote: *"Your body has been keeping notes."*
  - `font-serif`, large, `text-primary`, with a subtle muted attribution-less treatment
- Subtle grain via low-opacity radial gradient

### Form column

- Logo: `/LogoMain.png`, ~90px wide, top of column
- Heading: serif, ~`text-4xl`, `text-foreground` — "Welcome back."
- Subtext: `text-muted-foreground`, `text-base` — "Sign in to pick up where you left off."
- Inputs: shadcn `Input` with `Label`. Focus ring uses `--ring` (already plum). Slight rounding consistent with rest of app.
- "Forgot password?" — small `text-primary` link, right-aligned under password
- Primary button: shadcn `Button` default (already plum), full width, `h-11`
- Loading state: disable + `Loader2` spinner from `lucide-react` + label "Signing you in..."
- Footer link, centered: "New here? Create an account →" (`text-muted-foreground` with `text-primary` on the link portion)

### Validation

Lightweight inline validation with `zod` (already a likely dep via shadcn form, will check; if not, hand-rolled checks are fine — no new deps).
- Email: required + valid email → "Email looks wrong"
- Password: required → "Password is required"
- Errors render below each field in `text-destructive text-sm`

### Routing

Add route in `src/App.tsx`:
- `/signin` → `<SignIn />`
- "Create an account" link points to `/onboarding` (existing)
- "Forgot password?" logs to console for now

No `AppLayout` wrapper — SignIn is its own full-bleed page (no bottom nav, no header).

### Technical notes

- File: `src/pages/SignIn.tsx`, single component, TypeScript
- Use only existing semantic tokens (`bg-background`, `text-primary`, `bg-card`, etc.) — no hardcoded colors
- Serif: use `font-serif` Tailwind utility (system serif stack); matches the considered, editorial tone without adding font loading
- Responsive: `grid lg:grid-cols-2 min-h-screen`; visual column hidden below `lg`, replaced by a `lg:hidden` top banner
- Submit handler: `console.log({ email, password })`, fake 1.2s timeout to demo loading state
