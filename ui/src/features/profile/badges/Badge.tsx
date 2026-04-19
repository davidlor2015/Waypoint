import { BadgeIcon } from './BadgeIcon';

interface BadgeProps {
  name: string;
  category: string;
  description: string;
  rarity: 'standard' | 'rare' | 'epic' | 'legendary';
  icon: string;
  color: string;
  accentColor: string;
}

const rarityLabels = {
  standard: 'Standard',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary'
};

export function Badge({ name, category, description, rarity, icon, color, accentColor }: BadgeProps) {
  const isLegendary = rarity === 'legendary';
  const isEpic = rarity === 'epic';

  return (
    <div className="group relative">
      <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-500 border border-[#E5DDD5] hover:border-[#D4C5B9] h-full flex flex-col">
        {/* Rarity Indicator */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#9E9589]">
            {category}
          </span>
          <span
            className="text-[9px] tracking-[0.2em] uppercase px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: `${color}15`,
              color: color
            }}
          >
            {rarityLabels[rarity]}
          </span>
        </div>

        {/* Badge Icon Container */}
        <div className="relative mb-6 flex items-center justify-center">
          <div
            className="relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-105"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${color}12, ${color}08)`
            }}
          >
            {/* Outer Ring */}
            <div
              className="absolute inset-0 rounded-full opacity-20"
              style={{
                border: `1px solid ${color}`
              }}
            />

            {/* Inner Glow for Legendary/Epic */}
            {(isLegendary || isEpic) && (
              <div
                className="absolute inset-3 rounded-full opacity-30 blur-sm"
                style={{
                  background: `radial-gradient(circle, ${accentColor}40, transparent)`
                }}
              />
            )}

            {/* Icon */}
            <div className="relative z-10">
              <BadgeIcon icon={icon} color={color} accentColor={accentColor} rarity={rarity} />
            </div>

            {/* Legendary Shine Effect */}
            {isLegendary && (
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `conic-gradient(from 0deg, transparent 0deg, ${accentColor}20 45deg, transparent 90deg, transparent 270deg, ${accentColor}20 315deg, transparent 360deg)`
                }}
              />
            )}
          </div>
        </div>

        {/* Badge Info */}
        <div className="flex-1 flex flex-col">
          <h3 className="text-[19px] tracking-[-0.01em] text-[#2B2520] mb-2">
            {name}
          </h3>
          <p className="text-[13px] text-[#6B5E53] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Subtle Bottom Accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(90deg, transparent, ${accentColor}40, transparent)`
          }}
        />
      </div>
    </div>
  );
}