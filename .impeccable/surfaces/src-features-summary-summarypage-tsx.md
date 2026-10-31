---
version: 1
slug: "src-features-summary-summarypage-tsx"
primary_target: "src/features/summary/SummaryPage.tsx"
related_targets: ["src/features/app/AppShell.tsx","src/styles/tokens.css"]
---

## Scope

Whole app shell and every screen (Resumo, Lançamentos, Orçamento, Mais and sub-pages, sheets, onboarding). Visitor mode: Operate.

## Audience and task

Portfolio PWA simulating the "organizador do dia a dia": launch an expense in seconds, read where the month's money went, track category budgets. Must keep: bubble mechanism (proportional layout, tap to filter, spring entrance), all flows, test ids, accessible names, CSP, contrast tests, reduced motion.

## Direction contract

THESIS: The app reads as if Apple shipped it: iOS Human Interface idioms on the web (large titles that collapse into a translucent bar, inset grouped lists, squircle category tiles, sheets with grabber, capsule buttons). Refuses the generic card-stack dashboard with a colored hero card.

OWN-WORLD: iOS system grouped palette. Light: #F2F2F7 ground, white cells, #1D1D1F label, #636366 secondary, blue tint #0066CC / fill #0071E3. Dark: true black ground, #1C1C1E cells, #2C2C2E fills. Categories take Apple's increased-contrast system colors (light) and dark system colors (dark). SF system stack; SF Rounded for money figures. Hairline separators inset past the icon, translucent tab bar material.

STORY: Opening the app, the visitor sees the month's total and the bubbles in one Screen Time-style card, scans the ranked list with thin share bars, and sees the budget ring with how much remains.

FIRST VIEWPORT: Large title "Resumo" at top-left; wallet capsules below; compact month control; one white card with "Total gasto em <mês>", rounded 40px total, comparison line, then the bubbles filling the card width; tab bar fixed at bottom with the blue "Lançar" capsule floating above it at the right.

FORM: Pinned by the user brief ("padrão Apple"), which beats the roll; seed:8f96bf69b53f2e94 recorded after the fact. Signature move: the Activity-style budget ring (total spent of total budgeted) beside the three budget figures, plus the large title collapsing into the translucent bar on scroll. Motion grammar: Apple sheet curve cubic-bezier(0.32,0.72,0,1), press scale 0.97, springs for bubbles and ring.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
