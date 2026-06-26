Your message bundles a lot of work across the quiz UI, results page, and the entire super-admin surface. Before I start editing, I want to confirm scope and order so I don't burn a turn on the wrong slice.

## What I'll build (frontend only, mocks stay)

### 1. Quiz explanation panel (`/quiz/$sessionId`)

- Strip every "AI" / "Gemini" mention; rename to **Clinical Breakdown**.
- Panel wrapper: `bg-slate-50 border-l-4 border-teal-500 rounded-r-xl p-6`.
- Sections in order:
  1. Correct-answer banner (green)
  2. Why the correct answer is correct
  3. Why your answer was wrong (only when user got it wrong)
  4. **"When would each wrong choice be correct?"** — mandatory; lists only the distractors, each as: one-line "Why X is wrong" + one-line "Scenario where X would be correct"
  5. Clinical Pearl callout (amber)
  6. Related Topics chips
- Footer: `← Previous Question` / `Next Question →` aligned left/right.

### 2. Results page (`/quiz/$sessionId/results`)

- Hero band: full-width `bg-gradient-to-br from-[#0F2B4C] to-[#00B4A6]`, large circular donut (recharts), correct/incorrect/skipped chips, time + mode + bank, percentile line, two CTAs.
- 4 KPI cards (teal / amber / blue / purple gradients): Score Overview, Accuracy by Difficulty, Time Analysis, Subject Breakdown.
- Collapsible answer-review table (click row → inline explanation using the same Clinical Breakdown component).
- "Share your result" card (UI only).

### 3. Super-admin shell

- Rebuild `AdminShell` sidebar with the full grouped menu (Overview / Content / Users / Billing / Analytics / System) using the navy gradient, teal active border, uppercase section headers.
- Add `Exit Admin` footer item.

### 4. Super-admin dashboard (`/admin/dashboard`)

- 6 gradient KPI cards (blue/teal/green/amber/purple/rose) with floating icon circle + trend pill.
- 2-col charts: New Users / day (Area, 30d) + Revenue / month (Bar, 6mo, two series).
- 2-col: Plan distribution donut + Activity timeline feed.
- Top Question Banks table + Recent Transactions table.
- Quick Actions row.

### 5. Users management (`/admin/users`)

- Header with search + filter selects + summary pills.
- Redesigned table rows with avatar, role/subscription badges, per-row actions dropdown (View, Edit, Override Sub, Reset Pwd, Deactivate, Delete with typed-name confirm).

### 6. User profile detail (`/admin/users/$userId`) — new route

- Full page with profile header, subscription panel, activity stats, session history, admin actions.

All data stays mocked (`src/data/*`). No backend wiring.

## Out of scope this pass

- New admin sub-pages beyond `/admin/users/$userId` (Categories, Bulk Uploads, Medical Practitioners, API Keys, Roles & Permissions, etc.). The sidebar will link to them but they'll be lightweight placeholder pages unless you say otherwise.
- Lovable Cloud, real auth, payments.

## Question

This is ~6 substantial chunks. Do you want me to ship all six in one pass (longer turn, lots of files), or land them in order 1 → 6 so you can review each step?
