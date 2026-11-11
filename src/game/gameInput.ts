/**
 * Input wiring for the game overlay. Two sources:
 *   - keyboard on window in the CAPTURE phase, so consumed game keys (Space,
 *     ArrowUp, P, R, Esc) are stopImmediatePropagation'd BEFORE the board's
 *     spacebar-pan listener runs — the board underneath never reacts.
 *   - pointer/touch on the canvas → the primary action (jump), with the default
 *     prevented so a tap can't scroll the page or trigger pull-to-refresh.
 *
 * Intent, not physical keys, is reported: the overlay decides what "primary" /
 * "escape" mean for the current game state (start vs jump vs resume vs restart).
 */

export interface InputHandlers {
  /** Space / ArrowUp / canvas tap. */
  onPrimary: () => void
  /** P. */
  onPauseToggle: () => void
  /** R. */
  onRestart: () => void
  /** Esc. */
  onEscape: () => void
}

const PRIMARY_CODES = new Set(['Space', 'ArrowUp'])

export function installGameInput(canvas: HTMLElement, h: InputHandlers): () => void {
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) return

    // Space / ArrowUp are ALWAYS the primary game action (jump / start / resume /
    // restart) — even when a button is focused. We consume them so the focused
    // button isn't also activated by Space, which would double-fire. Enter is left
    // untouched so keyboard users can still activate a specific focused button.
    let consumed = true
    if (PRIMARY_CODES.has(e.code)) h.onPrimary()
    else if (e.code === 'KeyP') h.onPauseToggle()
    else if (e.code === 'KeyR') h.onRestart()
    else if (e.code === 'Escape') h.onEscape()
    else consumed = false

    if (consumed) {
      e.preventDefault()
      e.stopImmediatePropagation() // beat the board's window keydown listener
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault() // no scroll / text-select / pull-to-refresh on tap
    h.onPrimary()
  }

  // Capture phase so we run before other window listeners.
  window.addEventListener('keydown', onKeyDown, true)
  canvas.addEventListener('pointerdown', onPointerDown)

  return () => {
    window.removeEventListener('keydown', onKeyDown, true)
    canvas.removeEventListener('pointerdown', onPointerDown)
  }
}
