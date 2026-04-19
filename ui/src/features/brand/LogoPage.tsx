import { WaypointLogo } from "../../shared/ui/WaypointLogo";

export function LogoPage() {
  return (
    <main className="flex-1 w-full max-w-6xl mx-auto px-8 py-24 md:py-32 flex flex-col items-center">
      <div className="text-center mb-24 md:mb-32">
        <h1 className="text-[10px] md:text-xs tracking-[0.4em] font-medium text-[#8C8276] uppercase opacity-70">
          Brand Identity
        </h1>
        <div className="w-12 h-[1px] bg-[#D4AF37]/40 mx-auto mt-6"></div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white p-16 md:p-32 flex flex-col items-center justify-center gap-16 border border-[#E6D5C3]/40 rounded-sm shadow-[0_20px_40px_rgba(44,30,22,0.03)]">
          <WaypointLogo
            variant="full"
            className="scale-125 transform origin-center"
            theme="light"
          />
          <div className="text-[9px] tracking-[0.25em] text-[#8C8276] uppercase">
            Primary Logo
          </div>
        </div>

        <div className="bg-[#171A21] p-16 md:p-32 flex flex-col items-center justify-center gap-16 rounded-sm shadow-[0_20px_40px_rgba(0,0,0,0.2)]">
          <WaypointLogo
            variant="full"
            className="scale-125 transform origin-center"
            theme="dark"
          />
          <div className="text-[9px] tracking-[0.25em] text-[#A8B09C] uppercase">
            Reversed / Dark
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        <div className="bg-[#F9F8F6] p-16 flex flex-col items-center justify-center gap-12 border border-[#E6D5C3]/40">
          <WaypointLogo variant="mark" className="w-32 h-32" />
          <div className="text-[9px] tracking-[0.25em] text-[#8C8276] uppercase text-center">
            App Icon / Mark
            <br />
            <span className="lowercase opacity-60 mt-1 block">512x512</span>
          </div>
        </div>

        <div className="bg-[#F9F8F6] p-16 flex flex-col items-center justify-center gap-12 border border-[#E6D5C3]/40">
          <WaypointLogo variant="header" />
          <div className="text-[9px] tracking-[0.25em] text-[#8C8276] uppercase text-center">
            Nav Header
            <br />
            <span className="lowercase opacity-60 mt-1 block">h: 48px</span>
          </div>
        </div>

        <div className="bg-[#F9F8F6] p-16 flex flex-col items-center justify-center gap-12 border border-[#E6D5C3]/40">
          <WaypointLogo variant="favicon" className="w-8 h-8" />
          <div className="text-[9px] tracking-[0.25em] text-[#8C8276] uppercase text-center">
            Favicon
            <br />
            <span className="lowercase opacity-60 mt-1 block">32x32</span>
          </div>
        </div>
      </div>
    </main>
  );
}
