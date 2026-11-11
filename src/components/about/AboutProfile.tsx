import { Fragment } from 'react'
import { AboutExpertise } from './AboutExpertise'
import { INTRO, ROLES } from './aboutContent'

/** The editorial hero (Figma: profile photo 22:24 + heading 81:255 + role list
 *  81:262 + introduction quote 81:263 + skills). Two columns on desktop (photo |
 *  copy) and a single stacked column on mobile. The expertise row is composed
 *  into the copy column so it stays beside the photo, exactly as in the node. */
export function AboutProfile() {
  return (
    <div className="relative mt-[32px] grid grid-cols-[180px_1fr] gap-x-[64px] items-start max-[900px]:grid-cols-[168px_1fr] max-[900px]:gap-x-[40px] max-[640px]:grid-cols-[1fr] max-[640px]:gap-y-[18px] max-[640px]:mt-[26px]">
      <figure className="relative z-[1] w-[180px] h-[260px] m-0 max-[640px]:w-[160px] max-[640px]:h-[220px] max-[640px]:mx-auto rounded-[24px] overflow-hidden p-[4px] bg-gradient-to-br from-[#7aa88d] to-[#12b86f] shadow-[0_12px_30px_rgba(0,255,156,0.25)]">
        <img
          src="/assets/about/profile.svg"
          width={180}
          height={260}
          alt="Deneshraja Nedunchezhian"
          draggable={false}
          className="w-full h-full object-content rounded-[20px] block"
        />
      </figure>

      <div className="relative z-[1] pt-[20px] min-w-0 max-[640px]:pt-0 max-[640px]:text-center">
        <p className="m-0 font-satoshi font-bold text-[40px] leading-[1.05] tracking-[-0.5px] text-black max-[900px]:text-[34px] max-[640px]:text-[28px] max-[640px]:text-center">
          Hi, I&apos;m Deneshraja{' '}
          <span className="bg-white text-brand px-[8px] py-[1px] box-decoration-clone">N.</span>
        </p>

        <p className="mt-[16px] flex flex-wrap items-center gap-[12px] font-aeonik font-normal text-[20px] text-white max-[900px]:text-[18px] max-[640px]:justify-center max-[640px]:gap-[10px] max-[640px]:text-[16px]">
          {ROLES.map((role, i) => (
            <Fragment key={role}>
              {i > 0 && <span className="w-[7px] h-[7px] rounded-full bg-white/85" aria-hidden />}
              <span>{role}</span>
            </Fragment>
          ))}
        </p>

        <p
          id="about-intro"
          className="mt-[18px] max-w-[508px] font-aeonik font-light italic text-[20px] leading-[1.42] text-[#e5e5e5] max-[900px]:text-[18px] max-[640px]:mt-[14px] max-[640px]:max-w-full max-[640px]:text-[16px] max-[640px]:text-center"
        >
          {INTRO}
        </p>

        <AboutExpertise />
      </div>
    </div>
  )
}
