/** Says something to screen reader users through the hidden status region of the page. */
export function announce(doc: Document, message: string): void {
  const status = doc.querySelector("[data-page-status]");
  if (status !== null) status.textContent = message;
}
