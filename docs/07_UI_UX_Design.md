# UI/UX Design — GhanaPay Mobile

## 1. Design system

The customer-facing app uses Tailwind CSS utility classes with a
Material-Symbols icon set. The admin console uses a separate token-based
theming system (`src/lib/tokens.ts`, imported as `T`) with inline styles
— a deliberate visual distinction so customer and admin surfaces are
never confusable at a glance, reinforced by the separate `/admin-login`
entry point.

## 2. Color and branding

- Primary brand color: navy (`#020259` family) — Ghanaian financial-app
  convention, trustworthy/institutional feel.
- Gold accents for premium/tier indicators.
- Semantic colors: green (success/credit), red (error/debit), amber
  (warning/pending) — used consistently across wallet transaction
  displays, badges, and status indicators.

## 3. Component patterns actually used

| Pattern | Where | Notes |
|---|---|---|
| Card | Nearly every screen | Consistent elevation/border-radius container |
| Badge | Status indicators (transaction status, KYC status, account status) | Color mapped to semantic meaning — fixed in Phase 16 to use real status values (successful/failed/pending) rather than invented ones (completed) |
| Modal/Slide-in panel | Admin KYC review, admin user detail | Right-side slide-in panel pattern, consistent across /admin/kyc and /admin/users |
| Data table | Admin transactions, admin users, history | Consistent header styling, hover states |
| Empty states | Every list view | Explicit "no data" messaging rather than a blank screen — extended in later phases to also cover "not implemented yet" states (savings goals, bulk payments) |

## 4. Responsive design

Layouts use Tailwind's responsive utilities (sm/md/lg prefixes)
throughout. The admin sidebar collapses on smaller viewports. **Not
independently tested across a real device matrix** — responsiveness was
inherited from the original scaffold and preserved, not re-verified
device-by-device during this project's development.

## 5. Accessibility

Material Symbols icons are paired with text labels in most places (not
icon-only buttons without labels). Form inputs use associated label
elements. **No formal accessibility audit (WCAG compliance check, screen
reader testing) was performed** — this is a real gap, not claimed as
covered.

## 6. Honesty-driven UI patterns established during development

A distinctive pattern in this project's UI, worth documenting as a design
decision: **features that aren't implemented are visibly disabled with an
explanation, never left as a silent dead click target.** Examples:
- "Create New Goal" (savings goals) — disabled, tooltip explains why
- Bulk payments "Confirm & Send" — disabled, on-page banner explains what's missing
- 5 of 6 admin report types — disabled with "Not implemented" label
- Settings page email field — disabled with an explanation rather than
  silently discarding an edited value

This emerged directly from finding the opposite pattern (buttons that
looked functional but silently did nothing) repeatedly during development
— see Defect Log DEF-004, DEF-011.

## 7. Key screens (placeholders for actual screenshots)

TO BE COMPLETED BY PROJECT TEAM: insert actual screenshots for
submission. Suggested screens to capture:
- [SCREENSHOT: Login screen]
- [SCREENSHOT: Dashboard with real wallet balance]
- [SCREENSHOT: Send Money flow with recipient verification]
- [SCREENSHOT: KYC document upload]
- [SCREENSHOT: Admin KYC review queue]
- [SCREENSHOT: Admin overview dashboard]
- [SCREENSHOT: Statements page]

## 8. Design constraints inherited from the original scaffold

The visual design (colors, typography, spacing, iconography) was
inherited from the pre-existing repository rather than designed from
scratch during this project — the work documented across
docs/PROJECT_AUDIT.md was backend/data-integrity focused. Where UI
changes were made, they followed the existing visual language rather than
introducing a new one (e.g., the notification dropdown, Avatar component,
and admin report cards all match pre-existing card/badge styling).
