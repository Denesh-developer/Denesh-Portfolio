import type { WorkflowStep as Step } from '../../data/workflowItems'

/** A workflow step: sticker + optional colored plate + LIVE text
 *  (number/title/description) grouped together so hover lifts them as ONE
 *  cohesive unit (the label no longer stays behind while the sticker moves).
 *  Text stays real DOM — sharp at every zoom. */

export function WorkflowStep({ step }: { step: Step }) {
  const desc = step.description ?? step.descLines?.join(' · ') ?? ''
  // A "box" = a rectangle the text is centered inside: either a rendered colored
  // plate, or the sticker's own baked-in colored panel (labelBox). Falls back to
  // the free-floating labelX/labelY placement when neither is set.
  const box = step.plate
    ? { x: step.plate.x, y: step.plate.y, w: step.plate.w, h: step.plate.h, padL: 7, padR: 5 }
    : step.labelBox
      ? { ...step.labelBox, padL: step.labelBox.padL ?? 6, padR: step.labelBox.padR ?? 5 }
      : null
  return (
    <div
      className="group absolute z-[4] transition-transform duration-[180ms] ease-[ease] hover:[transform:translateY(-5px)_scale(1.05)] hover:z-[20] focus-within:z-[20]"
      style={{ left: step.x, top: step.y, width: step.w, height: step.h }}
    >
      {step.plate && (
        <div
          className="absolute rounded-[6px] z-[3] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
          style={{
            left: step.plate.x - step.x,
            top: step.plate.y - step.y,
            width: step.plate.w,
            height: step.plate.h,
            background: step.plate.color,
          }}
        />
      )}

      <button
        type="button"
        id={`wf-step-${step.id}`}
        className="absolute inset-0 z-[4] border-0 bg-transparent p-0 cursor-pointer focus-visible:[outline:2px_solid_#7aa88d] focus-visible:[outline-offset:2px] focus-visible:rounded-[8px]"
        aria-label={`Step ${step.step}: ${step.title}. ${desc}`}
      >
        <img
          src={step.asset}
          alt=""
          draggable={false}
          className="w-full h-full object-contain block [-webkit-user-drag:none] drop-shadow-[0_3px_4px_rgba(0,0,0,0.16)]"
        />
        <span className="absolute left-1/2 bottom-full [transform:translate(-50%,-6px)] w-[120px] bg-[#111] text-white font-satoshi text-[9px] leading-[1.3] text-left py-[6px] px-[8px] rounded-[6px] opacity-0 pointer-events-none transition-opacity duration-150 ease-[ease] z-[20] group-hover:opacity-100" aria-hidden>
          <strong className="block mb-[2px]">
            {step.step}. {step.title}
          </strong>
          {desc}
        </span>
      </button>

      <div
        className={`absolute z-[5] pointer-events-none flex flex-col ${box ? 'justify-center' : ''}`}
        style={
          box
            ? {
                // center the text within the box (plate or baked-in panel) and
                // constrain its width so it never spills past the note's edges
                left: box.x - step.x,
                top: box.y - step.y,
                width: box.w,
                height: box.h,
                paddingLeft: box.padL,
                paddingRight: box.padR,
                // tilt the whole label block (heading + description) as one unit
                rotate: step.rotation ? `${step.rotation}deg` : undefined,
              }
            : {
                left: step.labelX - step.x,
                top: step.labelY - step.y,
                width: step.labelWidth,
                rotate: step.rotation ? `${step.rotation}deg` : undefined,
              }
        }
        aria-hidden
      >
        <span
          className="font-dosis font-semibold text-[#111] leading-[1.1] tracking-[0.2px]"
          style={{ fontSize: step.headingSize ?? 10 }}
        >
          {step.step}. {step.title}
        </span>
        {step.description && (
          <span
            className="font-edu font-medium leading-[1.15] text-[#222] mt-[1px]"
            style={{ fontSize: step.descSize ?? 8 }}
          >
            {step.description}
          </span>
        )}
        {step.descLines && (
          <ul className="list-none mt-[1px] p-0">
            {step.descLines.map((l, i) => (
              <li key={i} className="font-edu font-medium text-[8px] leading-[1.35] text-[#222] before:content-['✓_'] before:text-brand">
                {l}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
