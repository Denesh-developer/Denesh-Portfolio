import type { WorkflowConnector as Conn } from '../../data/workflowItems'

/** One dashed, hand-drawn-feel arrow (a quadratic bezier). Rendered inside the
 *  section's shared <svg>, so it stays razor-sharp at any zoom. */
export function WorkflowConnector({ c }: { c: Conn }) {
  const mx = (c.x1 + c.x2) / 2
  const my = (c.y1 + c.y2) / 2
  const dx = c.x2 - c.x1
  const dy = c.y2 - c.y1
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const cx = mx + nx * c.curve
  const cy = my + ny * c.curve
  const d = `M ${c.x1} ${c.y1} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${c.x2} ${c.y2}`
  return (
    <path
      d={d}
      className="fill-none stroke-[#2b2b2b] [stroke-width:1.6] [stroke-dasharray:5_5] [stroke-linecap:round]"
      markerEnd="url(#wf-arrow)"
    />
  )
}
