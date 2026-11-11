import { FOCUS } from './aboutContent'

/** "Current Focus" block (Figma 82:872 title + 82:874 description) — the node's
 *  statement of what Kesavan is building right now. The fuller "current journey"
 *  narrative (LL.B. / legal tech) lives in the crawlable AboutSeo section so the
 *  visible modal stays faithful to node 80:5 and is not overfilled. */
export function AboutJourney() {
  return (
    <section className="mt-[42px] max-[640px]:mt-[34px]" aria-labelledby="about-focus-title">
      <h3
        id="about-focus-title"
        className="inline-block m-0 px-[6px] font-satoshi font-bold text-[24px] text-[#0f0a16] [background-image:linear-gradient(#d9d9d9,#d9d9d9)] bg-no-repeat [background-size:100%_74%] [background-position:0_64%] max-[640px]:text-[20px]"
      >
        Current Focus
      </h3>
      <p className="mt-[16px] max-w-[690px] font-aeonik font-normal text-[20px] leading-[1.42] text-black max-[900px]:text-[18px] max-[640px]:text-[16px]">
        {FOCUS}
      </p>
    </section>
  )
}
