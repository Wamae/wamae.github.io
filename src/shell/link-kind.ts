/** What a link is, as far as showing it in the in-desktop browser window is concerned. */
export type LinkKind =
  /** A page of this site (same origin). */
  | "internal"
  /** A web page on another site (http or https). */
  | "external"
  /** A link that hands over to another app, such as mail or the phone. It never opens a tab. */
  | "handoff"
  /** Anything the window must not load: scripts, data URLs, files, malformed addresses. */
  | "unsupported";

const HANDOFF_PROTOCOLS = ["mailto:", "tel:", "sms:"];
const WEB_PROTOCOLS = ["http:", "https:"];

/** Works out what kind of link `href` is, as seen from the page at `currentUrl`. */
export function classifyLink(href: string, currentUrl: string): LinkKind {
  let current: URL;
  let target: URL;
  try {
    current = new URL(currentUrl);
    target = new URL(href, current);
  } catch {
    return "unsupported";
  }
  if (HANDOFF_PROTOCOLS.includes(target.protocol)) return "handoff";
  if (!WEB_PROTOCOLS.includes(target.protocol)) return "unsupported";
  return target.origin === current.origin ? "internal" : "external";
}

/**
 * Decides whether an external page may be shown in a frame inside the window.
 * Only https pages can be framed by an https site (the browser blocks the rest), and a link can be
 * marked `embed: false` when its site is known to refuse being framed. The default is to try.
 */
export function canEmbed(url: string, embed: boolean | undefined): boolean {
  if (embed === false) return false;
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}
