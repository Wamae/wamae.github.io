# Performance budget

The site is small and static. Keep it that way.

## Targets
- Lighthouse (mobile): Performance, Accessibility, Best Practices and SEO each at 95 or above. The charter's objective O8 sets the final targets. Update this file if O8 changes.
- Largest Contentful Paint under 2.0 s, Cumulative Layout Shift under 0.05, Interaction to Next Paint under 200 ms, on a mid-range phone profile.

## Starting budgets (to be tightened once measured)
| Resource | Budget |
|---|---|
| JavaScript (compressed, whole site) | 50 KB or less |
| CSS (compressed) | 30 KB or less |
| Fonts | 1 or 2 files, self-hosted, subset, with `font-display: swap` |
| Images and icons | Inline SVG or small optimised files. No large images |
| Third-party requests | None |

## Rules
- Ship minimal JavaScript. Render pages at build time. Add a framework runtime only after an ADR shows a real need.
- Self-host all assets. No third-party scripts, fonts or trackers.
- Animate `transform` and `opacity` where possible. Avoid layout-triggering animation.
- The canvas screensaver runs only when visible and idle, uses `requestAnimationFrame`, caps its frame rate and stops when the tab is hidden.
- Respect `prefers-reduced-motion` (see [accessibility-and-reduced-motion-requirements.md](accessibility-and-reduced-motion-requirements.md)).
- Cache-friendly file names, so assets can be cached for a long time.

## How we check
- Lighthouse runs in CI on the built site. A drop below target, or a budget breach, fails the pull request.
- Bundle size is reported on each pull request.
