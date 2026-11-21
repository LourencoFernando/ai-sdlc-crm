/**
 * The browser fires a click when a drag ends over the card it started on. That click must not
 * open the deal, so a click right after a drag is ignored.
 */
let lastDragEnd = 0;
let dragging = false;

export function noteDragStart(): void {
  dragging = true;
}

export function noteDragEnd(): void {
  dragging = false;
  lastDragEnd = Date.now();
}

export function isClickFromDrag(): boolean {
  return dragging || Date.now() - lastDragEnd < 250;
}
