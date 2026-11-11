import {
  WORKFLOW_H,
  WORKFLOW_ORIGIN,
  WORKFLOW_PANEL,
  WORKFLOW_W,
  workflowAnnotations,
  workflowConnectors,
  workflowDecor,
  workflowDecorations,
  workflowSteps,
} from '../../data/workflowItems'
import { WorkflowConnector } from './WorkflowConnector'
import { WorkflowStep } from './WorkflowStep'
import { WorkflowNote } from './WorkflowNote'
import { WorkflowCharacter } from './WorkflowCharacter'

/**
 * The workflow, rebuilt from individual layered objects:
 *   panel → SVG connectors → step stickers + live text → notes/decor.
 * Positioned at the same board location as the original (98, 698) and moves /
 * zooms with the board as one group. `workflow-section` is kept as a hook for
 * the cdp-*.mjs verification scripts.
 */
export function WorkflowSection() {
  return (
    <div
      className="workflow-section absolute"
      style={{ left: WORKFLOW_ORIGIN.x, top: WORKFLOW_ORIGIN.y, width: WORKFLOW_W, height: WORKFLOW_H }}
      role="group"
      aria-label="My process — from idea to impact, seven workflow steps"
    >
      {/* paper panel — #f4ece0 base + color-burn paper texture (blend happens in the
          DOM so it burns onto the base colour; isolated so it doesn't touch the board) */}
      <div
        className="absolute bg-[#f4ece0] rounded-[10px] shadow-[0_10px_30px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)] z-[1] overflow-hidden isolate"
        style={{ left: WORKFLOW_PANEL.x, top: WORKFLOW_PANEL.y, width: WORKFLOW_PANEL.w, height: WORKFLOW_PANEL.h }}
      >
        <img
          src="/assets/workflowBg.svg"
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover mix-blend-color-burn pointer-events-none [-webkit-user-drag:none]"
        />
      </div>

      {/* SVG connectors (behind stickers) */}
      <svg
        className="absolute left-0 top-0 z-[2] pointer-events-none overflow-visible"
        viewBox={`0 0 ${WORKFLOW_W} ${WORKFLOW_H}`}
        width={WORKFLOW_W}
        height={WORKFLOW_H}
        aria-hidden
      >
        <defs>
          <marker id="wf-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L6,3.5 L0,7 Z" fill="#2b2b2b" />
          </marker>
        </defs>
        {workflowConnectors.map((c) => (
          <WorkflowConnector key={c.id} c={c} />
        ))}
      </svg>

      {/* title paper + live title */}
      <WorkflowCharacter item={workflowDecor[0]} />
      <div className="absolute z-[5] pointer-events-none flex flex-col rotate-[-4deg] ml-2" style={{ left: 28, top: 55 }}>
        <span className="font-caveat font-semibold text-[17px] text-[#111] leading-none mt-4 ">My Process</span>
        <span className="font-baloo font-medium text-[7px] text-[#333] mt-[2px] ">From Idea to Impact</span>
      </div>

      {/* steps */}
      {workflowSteps.map((s) => (
        <WorkflowStep key={s.id} step={s} />
      ))}

      {/* tagline note + live text */}
      <WorkflowCharacter item={workflowDecor[1]} />
      <div
        className="absolute z-[5] pointer-events-none font-edu font-medium text-[10px] leading-[1.28] text-[#111] text-left pl-1"
        style={{ left: 434, top: 465, width: 90 }}
      >
        I don’t just write code. I solve Problems and build solutions that matter.
      </div>

      {/* developer + works-on-my-machine */}
      <WorkflowCharacter item={workflowDecor[2]} />
      <WorkflowCharacter item={workflowDecor[3]} />

      {/* speech bubble — exact Figma SVG shape + live text */}
      <div className="absolute z-[6] pointer-events-none" style={{ left: 594, top: 406, width: 139, height: 81 }}>
        <img
          className="absolute inset-0 w-full h-full object-contain [-webkit-user-drag:none]"
          src="/assets/workflow/decorations/speech-bubble.svg"
          alt=""
          aria-hidden
          draggable={false}
        />
        <span className="absolute left-[15%] top-[26%] w-[68%] text-center font-caveat font-normal text-[13px] text-[#0f0a16] leading-[1.02] rotate-[3deg]">
          Let’s Build something awesome!
        </span>
      </div>

      {/* Dev Mode sticker — single Figma SVG */}
      <div className="absolute z-[5] pointer-events-none drop-shadow-[0_2px_3px_rgba(0,0,0,0.18)]" style={{ left: 719, top: 15, width: 180, height: 130 }}>
        <img
          className="absolute inset-0 w-full h-full object-contain [-webkit-user-drag:none]"
          src="/assets/Dev Mode.webp"
          alt="Dev Mode"
          draggable={false}
        />
      </div>

      {/* restored decorative doodles (rocket, heart, arrows, underlines, marks, pin) */}
      {workflowDecorations.map((d) => (
        <img
          key={d.id}
          className="absolute pointer-events-none [-webkit-user-drag:none] object-contain"
          src={d.asset}
          alt=""
          aria-hidden
          draggable={false}
          style={{ left: d.x, top: d.y, width: d.w, height: d.h, zIndex: d.zIndex ?? 5, transform: d.rotation ? `rotate(${d.rotation}deg)` : undefined }}
        />
      ))}

      {/* handwritten annotations */}
      {workflowAnnotations.map((n) => (
        <WorkflowNote key={n.id} note={n} />
      ))}
    </div>
  )
}
