# Accessibility and reduced motion requirements

These come from the charter (section 8). They are requirements, not nice-to-haves. The retro look must never make the content harder to reach.

## Accessibility: WCAG 2.2 AA
- **Semantic HTML first.** Use real headings in order, lists, buttons and links. Build the window look on top of semantic markup.
- **Content without JavaScript.** All experience and project content is in the page and readable with JavaScript off. The windowing layer enhances it.
- **Keyboard.** Everything the mouse can do is possible with the keyboard: open, move focus, close, switch windows. Focus is always visible. No keyboard traps. Provide a "skip the desktop" link to plain content.
- **Focus management.** Opening a window moves focus into it. Closing returns focus to what opened it.
- **Screen readers.** Windows use appropriate roles and accessible names. Icons have text alternatives. Decorative bevels, cursors and canvas effects are hidden from assistive technology.
- **Colour contrast.** The 16-colour palette limits contrast. Approved text and background pairs are chosen up front, checked with a contrast tool and listed in the design tokens. Do not use any other pair for text.
- **Not colour alone.** State and meaning are never shown by colour alone.
- **Touch and small screens.** Targets are large enough to use. At phone width, windows become stacked full-width panels.
- **Text.** Real text, not images of text. Respect browser zoom and text size.

## Reduced motion
- `prefers-reduced-motion: reduce` disables the zoom outlines, the cascade and the screensaver. State changes are instant.
- The screensaver never starts by itself for these users.
- Nothing flashes more than three times per second.
- A visible control pauses or disables all animation, for every visitor.
- Animations are an extra, so every state is still reachable without them.

## How we check
- Unit tests cover the choice of an instant animation for reduced motion.
- End-to-end tests run axe on each main view, test keyboard journeys, test with JavaScript off, and test with reduced motion on (see [end-to-end-test-guidelines.md](../testing/end-to-end-test-guidelines.md)).
- A manual screen-reader and keyboard pass is recorded before launch.
- Lighthouse accessibility score target: 100, with no unexplained exceptions.
