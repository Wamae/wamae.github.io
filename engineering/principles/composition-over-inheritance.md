# Composition over inheritance

Build behaviour by combining small objects and functions that have one job. Do not build it by extending base classes.

## Rule
- Do not use `extends` for classes you write. Use interfaces and inject collaborators.
- Prefer plain functions and small objects over class hierarchies.
- Share behaviour by passing it in (a function or an object), not by inheriting it.

## Why
- Inheritance couples a child to every detail of its parent and makes change risky.
- Composed parts can be swapped, faked in tests and reused in other combinations.
- It supports the Open/closed and Dependency inversion principles (see [solid-principles.md](solid-principles.md)).

## Example

Avoid:
```ts
class Window { open() { /* ... */ } }
class AnimatedWindow extends Window { open() { /* zoom, then super.open() */ } }
class ReducedMotionWindow extends AnimatedWindow { open() { /* skip zoom */ } }
```

Prefer:
```ts
class AppWindow {
  constructor(private readonly animation: WindowAnimation) {}
  async open(from: DOMRect, to: DOMRect) {
    await this.animation.run(from, to);
    /* show content */
  }
}

const animation = prefersReducedMotion ? new InstantChange() : new ZoomOutline();
const win = new AppWindow(animation);
```

Behaviour that varies (the animation) is a part passed in. The window class never changes when a new animation is added.

## Allowed exceptions
Inheritance is acceptable only when:
1. A framework or platform requires it (for example, a custom element must extend `HTMLElement`), and
2. The subclass only adapts the framework hook and delegates real work to composed objects.

Keep such classes thin. Note the reason in a comment or ADR.

## Review checklist
- [ ] No new `extends` on our own classes. If one exists, the exception above is documented.
- [ ] Varying behaviour is injected as a strategy, not selected by subclassing.
- [ ] Shared logic lives in small functions or objects that are composed, not in a base class.
