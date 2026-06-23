
# Medinovaqbank — UI Fine-Tuning & Completion Pass

This is a large scope. Below is exactly what I will change, grouped so you can confirm before I implement. Anything not listed here I will leave alone.

## 1. Critical fixes

1. **Hero / stats overlap** — already structurally separate, but I'll tighten spacing, add `pb-20` to hero, pull stats up with `-mt-12 relative z-10`, and ensure stat cards sit on opaque surface.
2. **Rotating hero → stylized HTML mock cards** — Replace image-based `RotatingHero` with a browser-chrome frame (red/yellow/green dots + `medinovaqbank.com/dashboard` URL bar) containing three CSS-rendered mock cards (Analytics, Quiz, Leaderboard), 4s interval, fade transition.
3. **Start Quiz button** — On `/banks` and dashboard, wire to `navigate({ to: "/quiz/configure/$bankId", params: { bankId } })`. Trial gate: if no subscription and trial exhausted, open subscription modal; otherwise navigate. Show "Trial: N questions left" badge when on trial.
4. **`/pricing` public** — Confirm route lives outside `_app` (it already does). Subscribe CTA: if logged in → checkout modal; if logged out → `/login?redirect=/pricing`.
5. **Logo** — Build `LogoLight` / `LogoDark` SVG components (navy `#0F2B4C` text + teal `#00B4A6` pulse cross). Wire dark variant into hero/admin sidebar, light variant into user sidebar/topbar/footer.

## 2. Global design polish

- Add gradient sidebar header, hover-lift on cards, `active:scale-95` on primary buttons.
- Add **subject color system** as CSS utility map in `src/data/subjectColors.ts` (Anatomy → blue, Pharm → emerald, etc.) and apply as 4px top border + colored badge on every question bank card.
- Add gradient tokens (primary, success, warning, premium) into `src/styles.css`.

## 3. New page: `/quiz/configure/$bankId`

Full page (not modal), two columns:
- **Left**: Mode toggle (Tutor / Quiz) as big selectable cards, question count pills + custom slider, difficulty pills, topic chips (from bank data), timer pills, order toggle, Cancel + Start Session.
- **Right**: Bank preview card (subject banner, count, difficulty, sessions, avg score, topic chips) + "Your stats on this bank" mini card.
- Already exists at `src/routes/quiz.configure.$bankId.tsx` — I'll rebuild it to this spec.

## 4. Quiz interface rebuild (`/quiz/$sessionId`)

- Top bar: Exit, bank name, mode badge, timer, progress bar.
- Left rail (220px, collapsible): numbered question circles with color legend (teal correct, red wrong, navy answered, orange ring current, grey unanswered, bookmark overlay). Click to jump.
- Main: question card with subject-tinted top border, option cards (hover lift, selected ring), Bookmark + Flag, Skip + Submit.
- **New explanation format** ("Clinical Breakdown", no "AI" wording):
  - Correct answer banner
  - Why correct
  - Why your choice was wrong (only if incorrect)
  - **Per-distractor "Would be correct if…" scenarios**
  - Clinical Pearl callout
  - Related topics chips

## 5. Out of scope this pass (will flag, not build)

- Wiring Lovable Cloud / real auth / real payments — you said keep mocks.
- Bulk question CSV importer.
- Real LLM explanation generator.

---

If this matches what you want, approve and I'll implement in one pass. If you want me to drop or add anything (e.g. skip the quiz-interface rebuild and only do fixes 1–5), say so and I'll revise.
