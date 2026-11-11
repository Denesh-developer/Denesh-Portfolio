import { SKILLS } from './aboutContent'

/** Core expertise / tooling as an infinite auto-scrolling marquee (Figma skill
 *  instances). The exact Figma logo assets are reused from /assets/about/icons.
 *  The set is rendered twice so the CSS translateX(-50%) loop is seamless; the
 *  second copy is aria-hidden so the tools are announced only once. Motion is
 *  paused on hover/focus (group-*) and disabled under prefers-reduced-motion. */
export function AboutExpertise() {
  return (
    <div
      className="group mt-[26px] w-full max-w-[640px] overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_7%,#000_93%,transparent)] motion-reduce:overflow-visible motion-reduce:[-webkit-mask-image:none] motion-reduce:[mask-image:none] max-[640px]:mt-[22px] max-[640px]:max-w-full"
      role="group"
      aria-label="Core expertise and tools"
    >
      <ul className="flex items-center w-max m-0 p-0 list-none animate-marquee will-change-transform group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:flex-wrap motion-reduce:w-full motion-reduce:gap-x-0 motion-reduce:gap-y-[10px]">
        {SKILLS.map((s) => (
          <li key={s.name} className="flex-none w-[40px] h-[40px] mr-[30px] max-[640px]:w-[36px] max-[640px]:h-[36px] max-[640px]:mr-[24px]">
            <img src={s.src} alt={s.name} width={40} height={40} loading="lazy" draggable={false} className="w-full h-full object-contain block" />
          </li>
        ))}
        {SKILLS.map((s) => (
          <li
            key={`dup-${s.name}`}
            className="flex-none w-[40px] h-[40px] mr-[30px] max-[640px]:w-[36px] max-[640px]:h-[36px] max-[640px]:mr-[24px] motion-reduce:hidden"
            aria-hidden="true"
          >
            <img src={s.src} alt="" width={40} height={40} loading="lazy" draggable={false} className="w-full h-full object-contain block" />
          </li>
        ))}
      </ul>
    </div>
  )
}
