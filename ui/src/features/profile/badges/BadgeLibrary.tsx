export function SharedDefs() {
  return (
    <svg width="0" height="0" className="absolute pointer-events-none">
      <defs>
        {/* Metallic Gold Gradient */}
        <linearGradient id="gold-grad" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#D4AF37" />
          <stop offset="30%" stopColor="#FDE389" />
          <stop offset="70%" stopColor="#A88225" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>

        {/* Copper / Bronze Gradient */}
        <linearGradient id="copper-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C46B4B" />
          <stop offset="35%" stopColor="#E5A082" />
          <stop offset="75%" stopColor="#7B3E25" />
          <stop offset="100%" stopColor="#C46B4B" />
        </linearGradient>

        {/* Deep Bronze (Darker, warmer) */}
        <linearGradient id="bronze-grad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#A37E55" />
          <stop offset="40%" stopColor="#C19B72" />
          <stop offset="80%" stopColor="#5E4226" />
          <stop offset="100%" stopColor="#A37E55" />
        </linearGradient>

        {/* Silver / Platinum Gradient */}
        <linearGradient id="silver-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#B3B6B5" />
          <stop offset="50%" stopColor="#FAFAFA" />
          <stop offset="85%" stopColor="#878A89" />
          <stop offset="100%" stopColor="#B3B6B5" />
        </linearGradient>

        {/* Inner shadow for enamel depth (Optional, can be applied for ultra realism) */}
        <filter id="enamel-depth" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.4" result="shadow" />
          <feComposite in="SourceGraphic" in2="shadow" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

// 1. The Navigator: Astrolabe / Celestial Navigation
export function NavigatorBadge() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 8-point starburst base metal */}
      <path d="M80 0 L92 50 L140 20 L110 68 L160 80 L110 92 L140 140 L92 110 L80 160 L68 110 L20 140 L50 92 L0 80 L50 68 L20 20 L68 50 Z" fill="url(#gold-grad)" />
      {/* Enamel inner (Espresso) */}
      <path d="M80 8 L90 54 L130 28 L106 70 L152 80 L106 90 L130 132 L90 106 L80 152 L70 106 L30 132 L54 90 L8 80 L54 70 L30 28 L70 54 Z" fill="#2C1E16" />
      {/* Metallic astrolabe rings */}
      <circle cx="80" cy="80" r="35" stroke="url(#gold-grad)" strokeWidth="3" />
      <circle cx="80" cy="80" r="45" stroke="url(#gold-grad)" strokeWidth="1" strokeDasharray="3 4" />
      <circle cx="80" cy="80" r="22" stroke="url(#gold-grad)" strokeWidth="1" />
      {/* Compass needles */}
      <path d="M80 18 L88 80 L80 142 L72 80 Z" fill="url(#gold-grad)" />
      <path d="M18 80 L80 88 L142 80 L80 72 Z" fill="url(#gold-grad)" />
      {/* Intricate central gem / pivot */}
      <circle cx="80" cy="80" r="8" fill="#F5F2ED" stroke="url(#gold-grad)" strokeWidth="1.5" />
    </svg>
  );
}

// 2. The Nomad: Arch / Dune continuous travel
export function NomadBadge() {
  return (
    <svg viewBox="0 0 160 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Arch Base Metal */}
      <path d="M 10 90 A 70 70 0 0 1 150 90 L 150 160 A 10 10 0 0 1 140 170 L 20 170 A 10 10 0 0 1 10 160 Z" fill="url(#copper-grad)" />
      {/* Enamel Inner (Terracotta/Clay) */}
      <path d="M 18 90 A 62 62 0 0 1 142 90 L 142 162 L 18 162 Z" fill="#9A5B44" />
      {/* Sky details */}
      <circle cx="80" cy="70" r="24" fill="url(#gold-grad)" />
      <circle cx="80" cy="70" r="16" fill="#F5F2ED" />
      {/* Dunes layering */}
      <path d="M 18 135 Q 60 105 110 145 L 142 162 L 18 162 Z" fill="#6B3322" />
      <path d="M -5 150 Q 80 115 150 162 L 18 162 Z" fill="url(#copper-grad)" />
      <path d="M 50 162 Q 100 135 155 162 Z" fill="#2C1E16" />
      {/* Distant Nomad / Bird symbol */}
      <path d="M 40 50 Q 45 45 50 50 Q 55 45 60 50 Q 50 55 40 50 Z" fill="url(#copper-grad)" />
    </svg>
  );
}

// 3. The Summit: Pennant / High Altitude
export function SummitBadge() {
  return (
    <svg viewBox="0 0 140 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Diamond / Hex Base Metal */}
      <polygon points="70,0 140,50 140,130 70,180 0,130 0,50" fill="url(#silver-grad)" />
      {/* Enamel Inner (Olive) */}
      <polygon points="70,12 128,54 128,126 70,168 12,126 12,54" fill="#6B705C" />
      {/* Geometric Sun */}
      <polygon points="70,18 80,28 70,38 60,28" fill="url(#gold-grad)" />
      {/* Back Mountain */}
      <polygon points="12,126 70,45 128,126" fill="url(#silver-grad)" />
      <polygon points="70,45 128,126 70,126" fill="#A8B09C" opacity="0.6" />
      {/* Front Mountain */}
      <polygon points="30,126 70,75 110,126" fill="#2C1E16" />
      {/* Snow Caps */}
      <polygon points="70,45 85,65 75,70 70,60 65,70 55,65" fill="#F5F2ED" />
      <polygon points="70,75 78,85 73,88 70,82 67,88 62,85" fill="#F5F2ED" />
    </svg>
  );
}

// 4. The Archivist: Wax Seal / Historical
export function ArchivistBadge() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Organic Wax Seal Base */}
      <path d="M80,0 C100,0 105,15 120,15 C135,15 140,30 145,45 C150,60 160,70 160,80 C160,90 150,100 145,115 C140,130 135,145 120,145 C105,145 100,160 80,160 C60,160 55,145 40,145 C25,145 20,130 15,115 C10,100 0,90 0,80 C0,70 10,60 15,45 C20,30 25,15 40,15 C55,15 60,0 80,0 Z" fill="url(#bronze-grad)" />
      {/* Inner Enamel (Deep Burgundy/Espresso) */}
      <path d="M80,10 C96,10 100,22 112,22 C124,22 128,34 132,46 C136,58 144,66 144,80 C144,94 136,102 132,114 C128,126 124,138 112,138 C100,138 96,150 80,150 C64,150 60,138 48,138 C36,138 32,126 28,114 C24,102 16,94 16,80 C16,66 24,58 28,46 C32,34 36,22 48,22 C60,22 64,10 80,10 Z" fill="#3B2626" />
      {/* Ionic Column / Key Details */}
      <rect x="73" y="45" width="14" height="70" fill="url(#bronze-grad)" />
      <rect x="65" y="40" width="30" height="7" rx="1" fill="url(#bronze-grad)" />
      <rect x="65" y="113" width="30" height="7" rx="1" fill="url(#bronze-grad)" />
      {/* Column base and top flourishes */}
      <path d="M58 40 Q70 25 80 40 Q90 25 102 40 L58 40 Z" fill="url(#bronze-grad)" />
      <path d="M58 120 Q70 135 80 120 Q90 135 102 120 L58 120 Z" fill="url(#bronze-grad)" />
      {/* Decorative stars */}
      <circle cx="45" cy="80" r="4" fill="url(#gold-grad)" />
      <circle cx="115" cy="80" r="4" fill="url(#gold-grad)" />
      {/* Fine lines (Archival text illusion) */}
      <path d="M73 45 L87 115 M87 45 L73 115" stroke="#3B2626" strokeWidth="1.5" opacity="0.4" />
    </svg>
  );
}

// 5. The Islander: Shell / Coastal
export function IslanderBadge() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Teardrop / Scallop Base */}
      <path d="M 80 5 C 130 40, 155 80, 130 130 C 110 165, 50 165, 30 130 C 5 80, 30 40, 80 5 Z" fill="url(#copper-grad)" />
      {/* Enamel (Warm Sand) */}
      <path d="M 80 16 C 122 46, 142 82, 120 122 C 104 150, 56 150, 40 122 C 18 82, 38 46, 80 16 Z" fill="#E6D5C3" />
      {/* Stylized Waves */}
      <path d="M 40 95 Q 60 75 80 95 T 120 95" stroke="url(#copper-grad)" strokeWidth="4" strokeLinecap="round" />
      <path d="M 45 115 Q 65 95 85 115 T 115 115" stroke="url(#copper-grad)" strokeWidth="3" strokeLinecap="round" />
      {/* Iridescent Pearl and Rays */}
      <circle cx="80" cy="55" r="14" fill="#FFFFFF" />
      <circle cx="80" cy="55" r="14" fill="url(#silver-grad)" opacity="0.6" />
      {/* Rays */}
      <path d="M 80 34 L 80 24 M 80 76 L 80 86 M 54 55 L 44 55 M 116 55 L 106 55" stroke="url(#copper-grad)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 62 37 L 55 30 M 98 37 L 105 30 M 62 73 L 55 80 M 98 73 L 105 80" stroke="url(#copper-grad)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 6. The Nocturne: Night Travel / Aurora
export function NocturneBadge() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Back Circle */}
      <circle cx="80" cy="80" r="75" fill="url(#silver-grad)" />
      {/* Enamel (Midnight Blue/Espresso) */}
      <circle cx="80" cy="80" r="66" fill="#171A21" />
      {/* Constellation Dots & Lines */}
      <line x1="60" y1="50" x2="100" y2="40" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <line x1="100" y1="40" x2="120" y2="80" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <line x1="120" y1="80" x2="90" y2="115" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="3 3"/>
      <line x1="90" y1="115" x2="50" y2="90" stroke="url(#gold-grad)" strokeWidth="1.5" strokeDasharray="3 3"/>
      
      <circle cx="60" cy="50" r="3" fill="url(#gold-grad)" />
      <circle cx="100" cy="40" r="4.5" fill="url(#gold-grad)" />
      <circle cx="120" cy="80" r="3.5" fill="url(#gold-grad)" />
      <circle cx="90" cy="115" r="5" fill="url(#gold-grad)" />
      <circle cx="50" cy="90" r="2.5" fill="url(#gold-grad)" />
      
      {/* Sweeping Crescent Overlay */}
      <path d="M 25 35 A 65 65 0 1 1 35 135 A 50 50 0 1 0 25 35 Z" fill="url(#gold-grad)" />
    </svg>
  );
}

// 7. The Pioneer: First Discoverer / Compass Shield
export function PioneerBadge() {
  return (
    <svg viewBox="0 0 160 170" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Faceted Shield Base */}
      <path d="M 80 0 L 150 30 L 140 100 C 130 140, 95 165, 80 170 C 65 165, 30 140, 20 100 L 10 30 Z" fill="url(#bronze-grad)" />
      {/* Enamel (Warm Bone / Neutral) */}
      <path d="M 80 12 L 138 38 L 130 98 C 122 130, 92 150, 80 155 C 68 150, 38 130, 30 98 L 22 38 Z" fill="#D6CFC7" />
      {/* Quadrant Lines (Fine Metal Details) */}
      <line x1="80" y1="12" x2="80" y2="155" stroke="url(#bronze-grad)" strokeWidth="2.5" />
      <line x1="26" y1="70" x2="134" y2="70" stroke="url(#bronze-grad)" strokeWidth="2.5" />
      {/* Star / Laurel Symbol */}
      <path d="M 80 25 L 98 55 L 130 70 L 98 85 L 80 115 L 62 85 L 30 70 L 62 55 Z" fill="url(#gold-grad)" />
      {/* Star 3D Facets (Shadows) */}
      <path d="M 80 25 L 98 55 L 80 70 Z M 130 70 L 98 85 L 80 70 Z M 80 115 L 62 85 L 80 70 Z M 30 70 L 62 55 L 80 70 Z" fill="#A88225" opacity="0.5" />
      {/* Central Geometry */}
      <circle cx="80" cy="70" r="10" fill="#F5F2ED" stroke="url(#bronze-grad)" strokeWidth="2" />
      <circle cx="80" cy="70" r="4" fill="url(#bronze-grad)" />
    </svg>
  );
}

// 8. The Meridian: Equator Crossing / Global
export function MeridianBadge() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Base Globe Metal */}
      <circle cx="80" cy="80" r="66" fill="url(#silver-grad)" />
      {/* Enamel Globe (Dark Clay / Espresso) */}
      <circle cx="80" cy="80" r="58" fill="#4B3D34" />
      
      {/* Globe Wireframe (Lat/Long) */}
      <path d="M 22 80 A 58 25 0 0 0 138 80 A 58 25 0 0 0 22 80 Z" fill="none" stroke="url(#silver-grad)" strokeWidth="1.5" />
      <path d="M 80 22 A 25 58 0 0 0 80 138 A 25 58 0 0 0 80 22 Z" fill="none" stroke="url(#silver-grad)" strokeWidth="1.5" />
      <path d="M 38 38 L 122 122 M 38 122 L 122 38" stroke="url(#silver-grad)" strokeWidth="1" opacity="0.6" />
      
      {/* Heavy Equatorial Band (Metal overlapping globe) */}
      <rect x="2" y="66" width="156" height="28" rx="4" fill="url(#gold-grad)" />
      {/* Equatorial Enamel Track */}
      <rect x="6" y="70" width="148" height="20" rx="2" fill="#2C1E16" />
      
      {/* Navigation ticks on the band */}
      <path d="M 16 70 L 16 90 M 36 70 L 36 90 M 56 70 L 56 90 M 76 70 L 76 90 M 104 70 L 104 90 M 124 70 L 124 90 M 144 70 L 144 90" stroke="url(#gold-grad)" strokeWidth="2.5" />
      
      {/* Central Node / Lock */}
      <circle cx="80" cy="80" r="14" fill="url(#copper-grad)" />
      <circle cx="80" cy="80" r="6" fill="#F5F2ED" />
    </svg>
  );
}
