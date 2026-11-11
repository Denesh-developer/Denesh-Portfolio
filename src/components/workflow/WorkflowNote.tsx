import type { WorkflowAnnotation } from '../../data/workflowItems'

/** A handwritten (Caveat) annotation — live text, never baked into an image. */
export function WorkflowNote({ note }: { note: WorkflowAnnotation }) {
  return (
    <div
      className="absolute z-[5] pointer-events-none font-caveat font-normal leading-none"
      aria-hidden
      style={{
        left: note.x,
        top: note.y,
        fontSize: note.size ?? 9,
        textAlign: note.align ?? 'left',
        color: note.color ?? '#111',
        transform: note.rotation ? `rotate(${note.rotation}deg)` : undefined,
      }}
    >
      {note.text.split('\n').map((line, i) => (
        <span key={i} className="block">
          {line}
        </span>
      ))}
    </div>
  )
}
