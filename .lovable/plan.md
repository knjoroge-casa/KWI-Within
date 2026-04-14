

# KWI — Personal Health Tracking App

A daily symptom and wellbeing logger for women navigating perimenopause, fibroids, and body changes. Warm, smart, grounded — not clinical, not a wellness brand.

---

## Design System

- **Primary**: Deep plum (`hsl(280, 40%, 25%)`) with forest green accent
- **Background**: Warm cream (`hsl(40, 30%, 97%)`) light / deep dark mode
- **Accent**: Amber/coral for alerts and flags
- **Typography**: Clean sans-serif, generous whitespace, mobile-first
- **Tone**: Warm language throughout ("How are you actually doing today?")
- **Dark mode** support from day one

---

## Screens to Build (7 total)

### 1. Onboarding — Multi-step Questionnaire
- Welcome screen → 3 steps with progress indicator
- Step 1: Body (fibroids, hormonal treatment, conditions, perimenopause status, cycle, joints)
- Step 2: Lifestyle (exercise types, food tracking, stress baseline)
- Step 3: Goals (multi-select: energy, cycle, fibroids, mental/emotional, exercise, general)
- "You can update this anytime in settings" note
- All tap/toggle inputs, minimal typing
- Stores profile in local state for conditional rendering elsewhere

### 2. Dashboard — Main Screen
- Greeting: "Good morning, Kui" with date
- Rotating Did You Know card (perimenopause facts, jokes, random info)
- Rotating Quote card (separate)
- Today's log status with CTA
- Heatmap calendar (energy by day, current + previous month)
- Functional capacity bar (full / reduced / rest day counts this week)
- Symptom frequency horizontal bar chart (top symptoms this month)
- AI insight card (weekly summary, dismissable)
- Quick stats row (avg energy, avg sleep, rest days)

### 3. Daily Log — Slide-up Overlay
- Triggered from dashboard, slides up from bottom
- Collapsible section cards, shown/hidden based on onboarding profile
- Sections: Energy & Function, Sleep, Mood & Mental, Appetite & Digestion, Cycle, Fibroid (conditional), Musculoskeletal (conditional), Skin & Hair, Cardiovascular, Urological, Activity (conditional), Substances, What's New (collapsed by default), Free text
- Progress bar at top, fixed Save button at bottom
- "+ Track something else today" to reveal hidden categories
- Mostly taps/toggles, warm labeling

### 4. Medical Records
- Bottom nav item with tabs: Labs / Scans / Medications / Supplements / Appointments
- Each tab: list view (most recent first) + Add button
- Lab results include sparkline per test showing value over time
- Simple add forms, field-by-field

### 5. Insights
- Current week AI summary card
- Monthly correlation flags card
- Trend charts: energy / sleep / symptom frequency over 90 days (line charts)
- Lab results trend with reference range band overlay
- Link to Doctor Report

### 6. Doctor Report (from Insights)
- Date range selector
- "What do you want to discuss?" free text
- Preview of included data (symptoms, labs, AI correlations, user notes)
- Generate Report button → structured clinical-register document preview
- Export as PDF button

### 7. Settings / Profile
- Edit onboarding answers (re-uses onboarding form components)
- Notification preferences with time picker
- Import cycle data (Apple Health XML / CSV upload UI)
- Account section placeholder

---

## Navigation
- **Bottom nav bar** (mobile): Dashboard / Log / Records / Insights
- **Top right**: Profile/Settings icon
- Responsive — works as sidebar on larger screens

---

## Custom Components
- **Heatmap calendar** with color intensity scale (built with divs/CSS grid)
- **Horizontal bar chart** for symptom frequency (lightweight, CSS-based or Recharts)
- **Line chart with reference range band** (Recharts)
- **Sparkline** component for lab results list
- **Collapsible section cards** for daily log
- **Slide-up overlay** (sheet/drawer pattern)
- **Multi-step form** with progress indicator
- **Rotating card** component (Did You Know / Quote)
- **Dismissable insight card**

---

## Data
- All placeholder data for user "Kui" simulating ~6 weeks of real usage
- Realistic energy patterns, sleep data, symptom frequencies, lab results
- Data stored in local state/constants — no backend, no auth
- Onboarding profile drives conditional section visibility in daily log

