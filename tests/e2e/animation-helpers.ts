import { expect, type Locator, type Page } from "@playwright/test";

export interface Outline {
  from: string;
  to: string;
  hidden: string | null;
  events: string;
  position: string;
  zIndex: string;
}
export interface Busy {
  on: number;
  off: number | null;
}

export const html = (page: Page) => page.locator("html");
export const h1 = (page: Page) => page.getByRole("heading", { level: 1 });
export const icons = (page: Page) => page.getByRole("navigation", { name: "Desktop folders" });
export const taskbar = (page: Page) => page.getByRole("region", { name: "Taskbar" });
export const toggle = (page: Page) => taskbar(page).getByRole("button", { name: "Animations" });
export const status = (page: Page) => page.locator("[data-page-status]");
export const browserWindow = (page: Page) => page.locator("#browser");
export const saver = (page: Page) => page.locator("canvas.screensaver");
export const startButton = (page: Page) => page.locator("summary", { hasText: "Start" });

/** Records every zoom outline that is put on the page, and when the busy cursor is on and off. */
export async function record(page: Page) {
  await page.addInitScript(() => {
    const outlines: Record<string, unknown>[] = [];
    const busy: { on: number; off: number | null }[] = [];
    Object.assign(window, { outlines, busy });
    new MutationObserver((records) => {
      for (const change of records) {
        for (const node of change.addedNodes) {
          if (node instanceof HTMLElement && node.classList.contains("zoom-outline")) {
            const style = getComputedStyle(node);
            outlines.push({
              from: node.dataset["from"],
              to: node.dataset["to"],
              hidden: node.getAttribute("aria-hidden"),
              events: style.pointerEvents,
              position: style.position,
              zIndex: style.zIndex,
            });
          }
        }
        if (change.type === "attributes" && change.attributeName === "data-busy") {
          const on = document.documentElement.dataset["busy"] === "true";
          if (on) busy.push({ on: performance.now(), off: null });
          else if (busy.length > 0 && busy.at(-1)?.off === null) {
            (busy.at(-1) as { off: number | null }).off = performance.now();
          }
        }
      }
    }).observe(document, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-busy"],
    });
  });
}

export const outlines = (page: Page) =>
  page.evaluate(() => (window as unknown as { outlines: Outline[] }).outlines);
export const busyLog = (page: Page) =>
  page.evaluate(() => (window as unknown as { busy: Busy[] }).busy);

const toNumbers = (text: string) => text.split(" ").map(Number);

/** The numbers of an outline are the rounded ones of a rectangle, so they match it to a pixel. */
export function expectNear(
  text: string | undefined,
  box: { x: number; y: number; width: number; height: number },
) {
  const [x, y, width, height] = toNumbers(text ?? "");
  expect(Math.abs((x ?? 0) - box.x)).toBeLessThanOrEqual(2);
  expect(Math.abs((y ?? 0) - box.y)).toBeLessThanOrEqual(2);
  expect(Math.abs((width ?? 0) - box.width)).toBeLessThanOrEqual(2);
  expect(Math.abs((height ?? 0) - box.height)).toBeLessThanOrEqual(2);
}

export async function boxOf(target: Locator) {
  const box = await target.boundingBox();
  if (box === null) throw new Error("no box");
  return box;
}

/** Waits for the running outline to end, with no fixed time. */
export async function outlineEnded(page: Page, count: number) {
  await expect.poll(async () => (await outlines(page)).length).toBe(count);
  await expect(html(page)).not.toHaveAttribute("data-animating", "zoom");
  await expect(page.locator(".zoom-outline")).toHaveCount(0);
}
