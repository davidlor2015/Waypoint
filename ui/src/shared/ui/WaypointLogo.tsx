type LogoProps = {
  variant?: "full" | "header" | "mark" | "favicon";
  className?: string;
  theme?: "light" | "dark";
};

export function WaypointLogo({
  variant = "full",
  className = "",
  theme = "light",
}: LogoProps) {
  const markColor = theme === "dark" ? "#F5F2ED" : "#2C1E16";
  const wordColor = theme === "dark" ? "#F5F2ED" : "#2C1E16";
  const starColor = "#D4AF37";

  const MarkSVG = (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <path
        d="M60 12 L63 26 L77 29 L63 32 L60 46 L57 32 L43 29 L57 26 Z"
        fill={starColor}
      />
      <path
        d="M20 40 L42 92 L60 48 L78 92 L100 40"
        stroke={markColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const FaviconSVG = (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full block"
      aria-hidden="true"
    >
      <path
        d="M16 3 L17 8 L22 9 L17 10 L16 15 L15 10 L10 9 L15 8 Z"
        fill={starColor}
      />
      <path
        d="M5 11 L11 26 L16 14 L21 26 L27 11"
        stroke={markColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "favicon") {
    return (
      <div className={className} aria-label="Waypoint favicon">
        {FaviconSVG}
      </div>
    );
  }

  if (variant === "mark") {
    return (
      <div className={className} aria-label="Waypoint brand mark">
        {MarkSVG}
      </div>
    );
  }

  if (variant === "header") {
    return (
      <div
        className={`flex items-center gap-2 ${className}`}
        aria-label="Waypoint logo"
      >
        <div className="w-6 h-6 flex-shrink-0">{MarkSVG}</div>
        <span
          className="uppercase text-sm tracking-[0.28em]"
          style={{
            color: wordColor,
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontWeight: 600,
          }}
        >
          Waypoint
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 ${className}`}
      aria-label="Waypoint logo"
    >
      <div className="w-10 h-10 flex-shrink-0">{MarkSVG}</div>
      <span
        className="uppercase text-xl tracking-[0.35em]"
        style={{
          color: wordColor,
          fontFamily: "Cormorant Garamond, Georgia, serif",
          fontWeight: 600,
        }}
      >
        Waypoint
      </span>
    </div>
  );
}
