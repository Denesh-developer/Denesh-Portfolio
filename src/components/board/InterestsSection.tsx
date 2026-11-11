/**
 * "Things I love" — a designed section that lives ON the board (like the
 * workflow), not in a modal. It sits below the workflow as the board's closing
 * zone: a centred heading over a tidy row of interest stickers with captions.
 * Positioned in board/composition coordinates, so it pans and zooms with the
 * rest of the canvas. EDIT the INTERESTS list to change what shows.
 */
type Interest = { src: string; label: string; caption: string; rot: number }

const INTERESTS: Interest[] = [
  { src: '/assets/stickers/mseries.svg', label: 'BMW M-Series', caption: 'a straight-six symphony', rot: -5 },
  { src: '/assets/stickers/car.svg', label: 'Cars', caption: 'engines & open roads', rot: 4 },
  { src: '/assets/stickers/spidey.svg', label: 'Spider-Man', caption: 'friendly neighbourhood fan', rot: -3 },
  { src: '/assets/stickers/Potterhead.svg', label: 'Potterhead', caption: 'still waiting on my letter', rot: 5 },
  { src: '/assets/stickers/harry9.svg', label: 'Wizarding World', caption: 'mischief managed', rot: -4 },
  { src: '/assets/stickers/chatgptcutie.svg', label: 'AI tinkerer', caption: 'building with AI, daily', rot: 4 },
  { src: '/assets/stickers/mindset.svg', label: 'Growth mindset', caption: 'always levelling up', rot: -2 },
]

/** Board-local origin + width (Figma composition space). Sits below the workflow
 *  (which bottoms out near y≈1559) with clearance, centred in the 1440 canvas. */
export const INTERESTS_ORIGIN = { x: 150, y: 1600 }
export const INTERESTS_W = 1140

export function InterestsSection() {
  return (
    <div
      className="absolute z-[3]"
      style={{ left: INTERESTS_ORIGIN.x, top: INTERESTS_ORIGIN.y, width: INTERESTS_W }}
      role="group"
      aria-label="Things I love — my interests"
    >
      {/* heading */}
      <div className="flex flex-col items-center text-center">
        <span className="font-caveat font-medium text-[32px] leading-none text-[#9a6a2f] -rotate-2">
          a few of my favourite things
        </span>
        <h3 className="font-satoshi font-black text-[52px] leading-none tracking-[-1.4px] text-[#0f0a16] mt-[6px]">
          Things I love <span className="text-[#e0607a]">♥</span>
        </h3>
        {/* hand-drawn underline sweep */}
        <svg width="220" height="14" viewBox="0 0 220 14" fill="none" className="mt-[10px]" aria-hidden>
          <path
            d="M4 8C40 3 92 3 130 6C160 8 196 6 216 4"
            stroke="#e0607a"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.85"
          />
        </svg>
      </div>

      {/* sticker row */}
      <div className="flex justify-center items-start gap-[22px] mt-[40px] max-[900px]:flex-wrap">
        {INTERESTS.map((i) => (
          <div key={i.label} className="group flex flex-col items-center text-center w-[142px]">
            <img
              src={i.src}
              alt={i.label}
              draggable={false}
              className="w-[130px] h-[130px] object-contain [-webkit-user-drag:none] drop-shadow-[0_10px_18px_rgba(0,0,0,0.18)] transition-transform duration-200 ease-[ease] group-hover:scale-[1.09] group-hover:-translate-y-[4px] group-hover:rotate-0"
              style={{ rotate: `${i.rot}deg` }}
            />
            <span className="font-satoshi font-bold text-[17px] leading-tight text-[#0f0a16] mt-[14px]">{i.label}</span>
            <span className="font-caveat text-[19px] leading-[1.05] text-[#7a6753] mt-[2px]">{i.caption}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
