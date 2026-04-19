import React from 'react';

interface BadgeIconProps {
  icon: string;
  color: string;
  accentColor: string;
  rarity: 'standard' | 'rare' | 'epic' | 'legendary';
}

export function BadgeIcon({ icon, color, accentColor, rarity }: BadgeIconProps) {
  const isLegendary = rarity === 'legendary';
  const strokeWidth = isLegendary ? 1.5 : 1.2;

  const icons: Record<string, React.ReactElement> = {
    temple: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M28 8L12 18V20H44V18L28 8Z"
          fill={accentColor}
          opacity="0.3"
        />
        <path
          d="M28 8L12 18M28 8L44 18M28 8V4M12 18V20H44V18M12 18H44"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M14 20V44H20V28H36V44H42V20"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10 44H46" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d="M24 36H32" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </svg>
    ),

    mountain: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M28 12L38 32L46 44H10L18 32L28 12Z"
          fill={color}
          opacity="0.15"
        />
        <path
          d="M28 12L18 32L10 44H46L38 32L28 12Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 12L34 24"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle cx="28" cy="12" r="1.5" fill={accentColor} />
        <path
          d="M22 36L28 26L34 36"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />
      </svg>
    ),

    wave: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M8 28C12 24 16 24 20 28C24 32 28 32 32 28C36 24 40 24 44 28C48 32 48 32 48 32"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M8 36C12 32 16 32 20 36C24 40 28 40 32 36C36 32 40 32 44 36C48 40 48 40 48 40"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.5"
          fill="none"
        />
        <path
          d="M8 20C12 16 16 16 20 20C24 24 28 24 32 20C36 16 40 16 44 20"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.3"
          fill="none"
        />
        <circle cx="44" cy="20" r="2" fill={accentColor} opacity="0.6" />
      </svg>
    ),

    dune: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M8 38C14 28 20 32 26 38C32 44 38 40 44 38C48 36 50 34 50 34"
          fill={color}
          opacity="0.1"
        />
        <path
          d="M8 38C14 28 20 32 26 38C32 44 38 40 44 38C48 36 50 34 50 34"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M6 44C12 36 18 38 24 44C30 50 36 46 42 44"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.4"
          fill="none"
        />
        <g opacity="0.3">
          <line x1="18" y1="24" x2="18" y2="28" stroke={color} strokeWidth="0.8" />
          <line x1="34" y1="20" x2="34" y2="24" stroke={color} strokeWidth="0.8" />
          <line x1="26" y1="18" x2="26" y2="22" stroke={color} strokeWidth="0.8" />
        </g>
      </svg>
    ),

    aurora: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M12 38C16 28 20 32 24 24C28 16 32 28 36 20C40 12 44 24 48 18"
          stroke={accentColor}
          strokeWidth={strokeWidth * 1.2}
          strokeLinecap="round"
          opacity="0.4"
          fill="none"
        />
        <path
          d="M10 34C14 26 18 28 22 22C26 16 30 24 34 18C38 12 42 20 46 16"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.6"
          fill="none"
        />
        <path
          d="M14 42C18 34 22 36 26 30C30 24 34 32 38 26C42 20 46 28 50 24"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.3"
          fill="none"
        />
        {[...Array(6)].map((_, i) => (
          <circle
            key={i}
            cx={12 + i * 7}
            cy={18 + Math.sin(i) * 4}
            r="0.8"
            fill={accentColor}
            opacity="0.5"
          />
        ))}
      </svg>
    ),

    leaf: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M28 44C28 44 14 38 14 24C14 16 20 10 28 10C36 10 42 16 42 24C42 38 28 44 28 44Z"
          fill={color}
          opacity="0.15"
        />
        <path
          d="M28 44C28 44 14 38 14 24C14 16 20 10 28 10C36 10 42 16 42 24C42 38 28 44 28 44Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 10C28 10 28 20 28 28C28 36 28 44 28 44"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M28 20C28 20 34 22 38 26"
          stroke={color}
          strokeWidth={strokeWidth * 0.7}
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M28 28C28 28 32 30 35 33"
          stroke={color}
          strokeWidth={strokeWidth * 0.7}
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
    ),

    compass: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="18" stroke={color} strokeWidth={strokeWidth} />
        <circle cx="28" cy="28" r="14" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
        <path
          d="M28 14L30 26L28 28L26 26L28 14Z"
          fill={accentColor}
          opacity="0.6"
        />
        <path
          d="M28 14V10M28 46V42M14 28H10M46 28H42"
          stroke={color}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
        />
        <path
          d="M28 14L30 26L28 28L18 32L28 14Z"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="28" r="2" fill={accentColor} />
      </svg>
    ),

    lantern: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect x="20" y="18" width="16" height="24" rx="2" stroke={color} strokeWidth={strokeWidth} />
        <path
          d="M22 18V14C22 12.8954 22.8954 12 24 12H32C33.1046 12 34 12.8954 34 14V18"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <line x1="28" y1="12" x2="28" y2="8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="20" y1="28" x2="36" y2="28" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
        <rect x="24" y="24" width="8" height="12" fill={accentColor} opacity="0.25" />
        <path
          d="M20 42L22 44H34L36 42"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),

    footprint: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <ellipse cx="26" cy="20" rx="4" ry="5" fill={color} opacity="0.2" />
        <ellipse cx="26" cy="20" rx="4" ry="5" stroke={color} strokeWidth={strokeWidth} />
        <ellipse cx="24" cy="28" rx="2.5" ry="3" fill={color} opacity="0.2" />
        <ellipse cx="24" cy="28" rx="2.5" ry="3" stroke={color} strokeWidth={strokeWidth * 0.8} />
        <ellipse cx="27" cy="28" rx="2" ry="2.5" fill={color} opacity="0.2" />
        <ellipse cx="27" cy="28" rx="2" ry="2.5" stroke={color} strokeWidth={strokeWidth * 0.8} />
        <ellipse cx="30" cy="27" rx="1.8" ry="2.2" fill={color} opacity="0.2" />
        <ellipse cx="30" cy="27" rx="1.8" ry="2.2" stroke={color} strokeWidth={strokeWidth * 0.8} />
        <ellipse cx="32" cy="25" rx="1.5" ry="2" fill={color} opacity="0.2" />
        <ellipse cx="32" cy="25" rx="1.5" ry="2" stroke={color} strokeWidth={strokeWidth * 0.8} />

        <ellipse cx="32" cy="38" rx="4" ry="5" fill={accentColor} opacity="0.15" />
        <ellipse cx="32" cy="38" rx="4" ry="5" stroke={color} strokeWidth={strokeWidth} opacity="0.6" />
      </svg>
    ),

    bowl: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M14 24C14 24 14 34 28 34C42 34 42 24 42 24"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <ellipse cx="28" cy="24" rx="14" ry="3" stroke={color} strokeWidth={strokeWidth} />
        <path
          d="M16 34C16 34 18 40 28 40C38 40 40 34 40 34"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d="M22 24V28C22 28 24 30 28 30C32 30 34 28 34 28V24"
          stroke={accentColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.5"
        />
        <line x1="20" y1="18" x2="22" y2="22" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
        <line x1="36" y1="18" x2="34" y2="22" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
        <line x1="28" y1="16" x2="28" y2="22" stroke={color} strokeWidth={strokeWidth * 0.8} strokeLinecap="round" />
      </svg>
    ),

    passport: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect x="16" y="12" width="24" height="32" rx="1" stroke={color} strokeWidth={strokeWidth} />
        <rect x="20" y="16" width="16" height="24" fill={color} opacity="0.08" />
        <circle cx="28" cy="24" r="4" stroke={accentColor} strokeWidth={strokeWidth} />
        <path
          d="M22 32C22 30 24 28 28 28C32 28 34 30 34 32"
          stroke={accentColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <line x1="22" y1="36" x2="34" y2="36" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
        <line x1="22" y1="38" x2="30" y2="38" stroke={color} strokeWidth={strokeWidth * 0.6} opacity="0.3" />
      </svg>
    ),

    globe: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="28" r="16" stroke={color} strokeWidth={strokeWidth} />
        <ellipse cx="28" cy="28" rx="6" ry="16" stroke={color} strokeWidth={strokeWidth} />
        <line x1="12" y1="28" x2="44" y2="28" stroke={color} strokeWidth={strokeWidth} />
        <ellipse cx="28" cy="28" rx="16" ry="6" stroke={color} strokeWidth={strokeWidth * 0.8} opacity="0.5" />
        <path
          d="M22 16C24 18 26 22 28 28C30 34 32 38 34 40"
          stroke={accentColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.6"
          fill="none"
        />
      </svg>
    ),

    wings: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M28 28C28 28 18 24 12 28C6 32 8 38 12 38C16 38 20 34 24 30"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 28C28 28 38 24 44 28C50 32 48 38 44 38C40 38 36 34 32 30"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 26C20 26 16 24 14 26C12 28 13 32 16 32"
          stroke={accentColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.5"
        />
        <path
          d="M36 26C36 26 40 24 42 26C44 28 43 32 40 32"
          stroke={accentColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="28" cy="28" r="2" fill={color} />
      </svg>
    ),

    crown: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <path
          d="M12 32L16 16L28 24L40 16L44 32H12Z"
          fill={accentColor}
          opacity="0.2"
        />
        <path
          d="M12 32L16 16L28 24L40 16L44 32"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line x1="12" y1="32" x2="44" y2="32" stroke={color} strokeWidth={strokeWidth * 1.5} strokeLinecap="round" />
        <circle cx="16" cy="16" r="2.5" fill={accentColor} />
        <circle cx="28" cy="24" r="2.5" fill={accentColor} />
        <circle cx="40" cy="16" r="2.5" fill={accentColor} />
        <path
          d="M14 32V38C14 39 14.5 40 16 40H40C41.5 40 42 39 42 38V32"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
    ),

    calendar: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect x="14" y="16" width="28" height="28" rx="2" stroke={color} strokeWidth={strokeWidth} />
        <line x1="14" y1="24" x2="42" y2="24" stroke={color} strokeWidth={strokeWidth} />
        <line x1="22" y1="16" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <line x1="34" y1="16" x2="34" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
        <circle cx="20" cy="30" r="1.5" fill={color} opacity="0.4" />
        <circle cx="28" cy="30" r="1.5" fill={color} opacity="0.4" />
        <circle cx="36" cy="30" r="1.5" fill={color} opacity="0.4" />
        <circle cx="20" cy="36" r="1.5" fill={color} opacity="0.4" />
        <circle cx="28" cy="36" r="1.5" fill={accentColor} />
        <circle cx="36" cy="36" r="1.5" fill={color} opacity="0.4" />
        <rect x="25" y="33" width="6" height="6" rx="1" stroke={accentColor} strokeWidth={strokeWidth * 0.8} />
      </svg>
    ),

    sun: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <circle cx="28" cy="32" r="8" fill={accentColor} opacity="0.2" />
        <circle cx="28" cy="32" r="8" stroke={color} strokeWidth={strokeWidth} />
        <g opacity="0.6">
          <line x1="28" y1="16" x2="28" y2="20" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="28" y1="44" x2="28" y2="48" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="44" y1="32" x2="40" y2="32" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="16" y1="32" x2="12" y2="32" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="39" y1="21" x2="36" y2="24" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="20" y1="40" x2="17" y2="43" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="39" y1="43" x2="36" y2="40" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <line x1="20" y1="24" x2="17" y2="21" stroke={accentColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
        <path
          d="M10 44C10 44 14 40 20 40C26 40 30 44 36 44C42 44 46 40 46 40"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity="0.3"
        />
      </svg>
    ),
  };

  return icons[icon] || icons.compass;
}