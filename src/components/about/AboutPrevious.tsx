/**
 * A small, editorial link to the previous portfolio at the very bottom of the
 * About card — a portfolio-history footnote, deliberately NOT a CTA. Uses the
 * card's existing typography (Satoshi), white-on-brand palette, and white/20
 * divider so it reads as an intentional, subtle reference.
 */
export function AboutPrevious() {
  return (
    <section
      className="mt-[40px] border-t border-solid border-white/20 pt-[24px] max-[640px]:mt-[34px]"
      aria-labelledby="about-previously-title"
    >
      <h3
        id="about-previously-title"
        className="m-0 font-satoshi text-[12px] font-bold uppercase tracking-[2px] text-white/65"
      >
        Previously
      </h3>
      <p className="mt-[8px] font-satoshi text-[15px] leading-[1.5] text-white/85 max-[640px]:text-[14px]">
        Want to see where I started?
      </p>
      <a
        href="https://denesh-developer.github.io/Portfolio/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-[6px] inline-block font-satoshi text-[15px] font-semibold text-white/90 underline decoration-transparent decoration-1 underline-offset-[5px] transition-[color,text-decoration-color] duration-150 hover:text-white hover:decoration-white/70 focus-visible:rounded-[4px] focus-visible:[outline:2px_solid_#ffffff] focus-visible:[outline-offset:3px] motion-reduce:transition-none max-[640px]:text-[14px]"
      >
        View my previous portfolio ↗
      </a>
    </section>
  )
}
