import React from 'react';
import {
  SharedDefs,
  NavigatorBadge,
  NomadBadge,
  SummitBadge,
  ArchivistBadge,
  IslanderBadge,
  NocturneBadge,
  PioneerBadge,
  MeridianBadge,
} from './BadgeLibrary';

const BADGES = [
  { name: 'The Navigator', Component: NavigatorBadge },
  { name: 'The Nomad',     Component: NomadBadge },
  { name: 'The Summit',    Component: SummitBadge },
  { name: 'The Archivist', Component: ArchivistBadge },
  { name: 'The Islander',  Component: IslanderBadge },
  { name: 'The Nocturne',  Component: NocturneBadge },
  { name: 'The Pioneer',   Component: PioneerBadge },
  { name: 'The Meridian',  Component: MeridianBadge },
] as const;

function BadgeItem({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 group">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-2 drop-shadow-[0_8px_16px_rgba(44,30,22,0.1)] group-hover:drop-shadow-[0_16px_28px_rgba(44,30,22,0.2)] cursor-pointer will-change-transform">
        {children}
      </div>
      <span className="text-[9px] tracking-[0.25em] text-[#8C8276] font-semibold uppercase opacity-60 group-hover:opacity-100 transition-opacity duration-500">
        {name}
      </span>
    </div>
  );
}

export function BadgeCollection() {
  return (
    <div className="w-full">
      <SharedDefs />
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-4 sm:gap-6 justify-items-center">
        {BADGES.map(({ name, Component }) => (
          <BadgeItem key={name} name={name}>
            <Component />
          </BadgeItem>
        ))}
      </div>
    </div>
  );
}
