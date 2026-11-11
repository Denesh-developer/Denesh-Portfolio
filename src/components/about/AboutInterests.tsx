import { BUILD_ITEMS } from './aboutContent'

/** "What I Build" list (Figma 83:175 title + work items 83:230–234): a numbered,
 *  divider-separated list of the things Kesavan ships. The up-right arrows are
 *  decorative (Figma imgFrame7) and recreated as crisp inline SVG. */
export function AboutInterests() {
  return (
    <section className="mt-[40px] max-[640px]:mt-[34px]" aria-labelledby="about-build-title">
      <h3
        id="about-build-title"
        className="inline-block m-0 px-[6px] font-satoshi font-bold text-[24px] text-[#0f0a16] [background-image:linear-gradient(#d9d9d9,#d9d9d9)] bg-no-repeat [background-size:100%_74%] [background-position:0_64%] max-[640px]:text-[20px]"
      >
        What I Build
      </h3>
      <ul className="mt-[16px] p-0 list-none">
        {BUILD_ITEMS.map((item, i) => (
          <li
            key={item.label}
            className="group relative isolate overflow-hidden border-t border-solid border-white/25 last:border-b transition-colors duration-300 hover:border-white/45 motion-reduce:transition-none"
          >
            {/* Full-bleed photo, revealed on hover (drop a JPG in public/assets/about/build/). */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 bg-cover bg-center opacity-0 scale-[1.08] transition-[opacity,transform] duration-500 ease-out group-hover:opacity-100 group-hover:scale-100 motion-reduce:transition-none motion-reduce:scale-100"
              style={{ backgroundImage: `url("${item.image}")` }}
            />
            {/* Dark scrim so the white text stays legible on top of any photo. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 opacity-0 bg-gradient-to-r from-black/75 via-black/50 to-black/20 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none"
            />
            <div className="grid grid-cols-[54px_1fr_auto] items-center gap-[8px] py-[26px] px-[12px] text-white max-[900px]:py-[22px] max-[640px]:grid-cols-[40px_1fr_auto] max-[640px]:py-[18px] max-[640px]:px-[8px]">
              <span className="font-satoshi font-bold text-[32px] leading-none text-white transition-colors duration-300 group-hover:text-brand max-[900px]:text-[28px] max-[640px]:text-[22px]">
                {i + 1}
              </span>
              <span className="font-satoshi font-bold text-[32px] leading-none transition-[transform,text-shadow] duration-300 group-hover:translate-x-[8px] group-hover:[text-shadow:0_2px_16px_rgba(0,0,0,0.6)] motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 max-[900px]:text-[28px] max-[640px]:text-[22px]">
                {item.label}
              </span>
              <svg
                className="text-white transition-transform duration-300 group-hover:translate-x-[4px] group-hover:-translate-y-[4px] group-hover:text-brand motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <path
                  d="M7 17L17 7M17 7H8M17 7V16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
