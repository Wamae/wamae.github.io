# SOLID

Apply these when you design modules, classes and functions. They are a means to code that is easy to change and test, not a goal in itself. If applying a principle makes a small piece of code harder to read, keep the code simple and note why.

Examples are in TypeScript and use this site's domain (a windowing UI, animations and CV data).

## S: Single responsibility
A module has one reason to change.

- A window manager tracks windows and focus. It does not draw the zoom outline, load CV data or sort entries.
- Sorting experience entries is its own function. Rendering is separate. Loading is separate.
- If you cannot describe a module without using "and", split it.

## O: Open for extension, closed for modification
Add behaviour by adding code, not by editing tested code.

```ts
// Each animation is a strategy. Adding a new one does not touch the player.
interface WindowAnimation {
  run(from: DOMRect, to: DOMRect): Promise<void>;
}

class ZoomOutline implements WindowAnimation { /* ... */ }
class InstantChange implements WindowAnimation { /* used for reduced motion */ }
```

Avoid long `if`/`switch` chains on a type. Use a lookup of strategies instead.

## L: Liskov substitution
Anything that implements an interface must work wherever that interface is expected, without surprises.

- `InstantChange` must resolve its promise like `ZoomOutline` does. It must not throw "not supported".
- Do not narrow what a method accepts or weaken what it promises.
- If a substitute needs special handling by the caller, the abstraction is wrong.

## I: Interface segregation
Small, focused interfaces. Do not force a consumer to depend on methods it does not use.

- A component that only reads entries depends on `EntryReader`, not on a large `ContentStore` that can also write and delete.
- Prefer several one- or two-method interfaces over one wide one.

## D: Dependency inversion
High-level code depends on abstractions. Concrete choices are wired in one place.

```ts
class DesktopShell {
  constructor(
    private readonly animation: WindowAnimation,
    private readonly clock: Clock,
    private readonly entries: EntryReader,
  ) {}
}
```

- Pass dependencies in through the constructor or function arguments. Do not import a concrete module deep inside business logic.
- Wire everything at the edge (an `init`/composition-root file), so tests can pass in fakes.
- Browser APIs (`window`, `document`, timers, `matchMedia`, `requestAnimationFrame`) are dependencies too. Wrap them behind small interfaces so they can be faked in unit tests.

## Review checklist
- [ ] Each new module has one clear responsibility.
- [ ] New behaviour is added by extension, not by editing a growing conditional.
- [ ] Implementations are interchangeable behind their interface.
- [ ] Interfaces are small and consumer-specific.
- [ ] Dependencies are injected and wired in one place.
