/** Top bar of the About card (Figma 80:247 + 80:250): the "About Me" label on
 *  the left and the "Available for Work" status on the right. The label doubles
 *  as the dialog's accessible name (id="about-title"). */
export function AboutHeader() {
  return (
    <div className="flex items-center justify-between gap-[16px] font-inter">
      <h2 id="about-title" className="m-0 text-[16px] font-normal text-black max-[640px]:text-[15px]">
        About Me
      </h2>
      <p className="inline-flex items-center gap-[8px] text-[16px] font-normal text-black max-[640px]:text-[15px]">
        <span className="w-[10px] h-[10px] rounded-full bg-[#FFFFFF] shadow-[0_0_0_3px_rgba(10,207,131,0.18)]" aria-hidden />
        Available for Work
      </p>
    </div>
  )
}
