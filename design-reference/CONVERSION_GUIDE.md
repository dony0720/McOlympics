# dc.html → React/Tailwind conversion guide

Reference source: `레크레이션 점수판.dc.html` in this folder (verbatim, verified-working prototype).

## Rules

1. **Pixel fidelity.** Every `padding`, `border-radius`, `font-size`, `letter-spacing`, `gap` value in the
   reference must survive unchanged. Use Tailwind arbitrary values: `padding:17px 18px` → `px-[18px] py-[17px]`,
   `border-radius:14px` → `rounded-[14px]`, `font-size:17px` → `text-[17px]`.
2. **Brand/system colors** use the `@theme` tokens from `src/index.css` (Task 3): `#03b26c` → `bg-brand`/`text-brand`,
   `#191f28` → `text-ink`, `#8b95a1` → `text-muted`, `#f2f4f6` → `bg-line`/`border-line`, etc. Never inline these hexes.
3. **Per-team colors** (`team.color`, dynamically assigned) are the one exception — always
   `style={{ backgroundColor: team.color }}`, never a Tailwind class.
4. **`style-active="..."` in the reference** = the CSS `:active` pseudo-class → Tailwind `active:` variant
   (e.g. `style-active="background:#02a05f;"` on a `bg-brand` button → add `active:bg-brand-dark`).
5. **`style-focus="..."`** = `:focus` → Tailwind `focus:` variant.
6. **Font weights:** 500 → `font-medium`, 600 → `font-semibold`, 700 → `font-bold`, 800 → `font-extrabold`.
7. **`sc-if value="{{ x }}"`** → `{x && (...)}` in JSX.
8. **`sc-for list="{{ xs }}" as="x"`** → `{xs.map((x) => (...))}` with a stable `key` (use the row's `id`/`key`
   field from the view model; the reference's `hint-placeholder-count` is a design-tool loading hint — drop it).
9. **`{{ expr }}`** → `{expr}`.
10. Inline `<svg>` icons are copied verbatim (same `path d=`, `viewBox`, `stroke-width`) — only the wrapping
    element becomes JSX.
11. Reusable pieces (team avatar circle, back-chevron button, primary/secondary CTA button, -/value/+ stepper,
    3-way status segmented control) live in `src/components/ui/` (Task 4) — import those instead of re-inlining
    the markup on every page.
12. **Folder placement:** a new component goes in `src/components/ui/` only if it has zero knowledge of
    scoreboard state; anything that reads a `view: ScoreboardView` (or a slice of it) goes in `src/pages/`,
    grouped into a subfolder (`manager/`, `admin/`, `shop/`) if it's part of a multi-step flow.
