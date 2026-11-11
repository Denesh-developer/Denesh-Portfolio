import type { WorkflowDecor } from '../../data/workflowItems'

/** A decorative workflow image/vector (developer character, torn-paper notes,
 *  the "works on my machine" sticker). Individual asset, not a flattened crop. */
export function WorkflowCharacter({ item }: { item: WorkflowDecor }) {
  return (
    <img
      className="absolute pointer-events-none [-webkit-user-drag:none] object-contain"
      src={item.asset}
      alt={item.alt}
      aria-hidden={item.alt ? undefined : true}
      draggable={false}
      width={Math.round(item.w)}
      height={Math.round(item.h)}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h, zIndex: item.zIndex ?? 4 }}
    />
  )
}
