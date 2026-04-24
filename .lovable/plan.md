# Daily Log — Add Intimacy Section

New collapsible section on the Daily Log page covering whether sex happened, how often, when, and a couple of light follow-ups. Same tone as the rest of the log — warm, plain, friction-free, single-tap chips, nothing clinical.

## Placement

Inserted between **Cycle** and **Skin & Hair** (sits naturally next to cycle-adjacent body data, before the more general body-system sections).

Section title: **"Intimacy"**
Subtitle: *"Optional — skip if not relevant"*

Stays collapsed by default like all other sections.

## Questions

1. **Did you have sex today?**
  - No / Yes / Solo
   *(If "No" or skipped → section ends. Everything below only shows if Yes or Solo is selected.)*
2. **How many times?**
  - Once / Twice / Three+
3. **When?** *(multi-select — more than one can be tapped)*
  - Morning / Afternoon / Evening / Night
4. **How did it feel physically?**
  - Good / Neutral / Some discomfort / Painful
5. **Desire today** *(asked even if "No" above — useful libido signal on its own; will reposition as the first question and always show)*
  - High / Normal / Low / None
   → Actually, cleaner to put **Desire** as question 1 (always visible), then "Did you have sex today?" as question 2 with the conditional follow-ups. That way libido gets tracked daily regardless of activity.

### Final question order

1. **Desire today** — High / Normal / Low / None *(always shown)*
2. **Did you have sex today?** — No / Yes / Solo *(always shown)*
3. *(if Yes/Solo)* **How many times?** — Once / Twice / Three+
4. *(if Yes/Solo)* **When?** *(multi-select)* — Morning / Afternoon / Evening / Night
5. *(if Yes/Solo)* **How did it feel?** — Good / Neutral / Some discomfort / Painful - **no need for this, remove this** 

## Data model

New `LogIntimacy` interface added to `src/data/types.ts`, and `intimacy?: LogIntimacy` added to `DailyLog`:

```ts
export interface LogIntimacy {
  desire: 'high' | 'normal' | 'low' | 'none' | null;
  had_sex: 'no' | 'yes' | 'solo' | null;
  frequency: 'once' | 'twice' | 'three_plus' | null;
  time_of_day: ('morning' | 'afternoon' | 'evening' | 'night')[];
  physical_feel: 'good' | 'neutral' | 'discomfort' | 'painful' | null;
}
```

## Files to change

- `src/data/types.ts` — add `LogIntimacy` interface, add `intimacy?` field to `DailyLog`.
- `src/pages/DailyLog.tsx` — add new `<LogSection title="Intimacy" subtitle="Optional — skip if not relevant">` between Cycle and Skin & Hair, with five `useState` hooks and conditional rendering for questions 3–5.

No placeholder data changes, no dashboard/insights impact.