import { useState } from 'react';
import { motion } from 'framer-motion';
import { FlightSearch } from '../search';
import { useTeleportScore } from '../../shared/hooks/useTeleportScore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExplorePageProps {
  token: string;
  onPlanTrip: (destination: string) => void;
}

type DestinationTag = 'Beach' | 'Culture' | 'Adventure' | 'Food' | 'Nature';

interface Destination {
  id: string;
  city: string;
  country: string;
  tag: DestinationTag;
  description: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const DESTINATIONS: Destination[] = [
  { id: 'tokyo',      city: 'Tokyo',        country: 'Japan',        tag: 'Culture',   description: 'Neon lights, ancient temples, and world-class ramen.' },
  { id: 'bali',       city: 'Bali',         country: 'Indonesia',    tag: 'Beach',     description: 'Terraced rice fields, hidden temples, and turquoise surf.' },
  { id: 'paris',      city: 'Paris',        country: 'France',       tag: 'Culture',   description: 'Café culture, art museums, and a tower lit at midnight.' },
  { id: 'patagonia',  city: 'Patagonia',    country: 'Argentina',    tag: 'Adventure', description: 'Glaciers, granite towers, and trails with no mobile signal.' },
  { id: 'barcelona',  city: 'Barcelona',    country: 'Spain',        tag: 'Food',      description: 'Tapas bars, modernist architecture, and late-night markets.' },
  { id: 'kyoto',      city: 'Kyoto',        country: 'Japan',        tag: 'Culture',   description: 'Bamboo forests, geisha districts, and 1,600 Buddhist temples.' },
  { id: 'santorini',  city: 'Santorini',    country: 'Greece',       tag: 'Beach',     description: 'Blue-domed churches, cliff-top sunsets, and volcanic beaches.' },
  { id: 'queenstown', city: 'Queenstown',   country: 'New Zealand',  tag: 'Adventure', description: 'Bungee jumping, ski slopes, and fjords around every bend.' },
  { id: 'rome',       city: 'Rome',         country: 'Italy',        tag: 'Culture',   description: 'Two thousand years of history on every street corner.' },
  { id: 'marrakech',  city: 'Marrakech',    country: 'Morocco',      tag: 'Culture',   description: 'Labyrinthine souks, rooftop riads, and mint tea at sunset.' },
  { id: 'costa-rica', city: 'Costa Rica',   country: 'Costa Rica',   tag: 'Nature',    description: 'Cloud forests, active volcanoes, and priceless biodiversity.' },
  { id: 'bangkok',    city: 'Bangkok',      country: 'Thailand',     tag: 'Food',      description: 'Street carts, floating markets, and flavours that hit hard.' },
  { id: 'iceland',    city: 'Iceland',      country: 'Iceland',      tag: 'Adventure', description: 'Northern lights, lava fields, and geysers at every turn.' },
  { id: 'amalfi',     city: 'Amalfi Coast', country: 'Italy',        tag: 'Beach',     description: 'Clifftop villages, turquoise coves, and limoncello by the sea.' },
  { id: 'cape-town',  city: 'Cape Town',    country: 'South Africa', tag: 'Nature',    description: 'Table Mountain, penguin colonies, and the end of the world.' },
  { id: 'new-york',   city: 'New York',     country: 'USA',          tag: 'Culture',   description: 'Five boroughs, infinite bagels, and a skyline that delivers.' },
];

const ALL_TAGS: Array<'All' | DestinationTag> = ['All', 'Beach', 'Culture', 'Adventure', 'Food', 'Nature'];

// ── Tag config ────────────────────────────────────────────────────────────────

interface TagConfig {
  pillCls: string;
  headerBgCls: string;
  headerTextCls: string;
  filterActiveCls: string;
}

const TAG_CONFIG: Record<DestinationTag, TagConfig> = {
  Beach:     { pillCls: 'bg-ocean/10 text-ocean border-ocean/25',       headerBgCls: 'bg-ocean',   headerTextCls: 'text-white',  filterActiveCls: 'bg-ocean text-white border-ocean' },
  Culture:   { pillCls: 'bg-sunny/30 text-sunny-dark border-sunny/40',  headerBgCls: 'bg-sunny',   headerTextCls: 'text-navy',   filterActiveCls: 'bg-sunny text-navy border-sunny' },
  Adventure: { pillCls: 'bg-coral/10 text-coral border-coral/25',       headerBgCls: 'bg-coral',   headerTextCls: 'text-white',  filterActiveCls: 'bg-coral text-white border-coral' },
  Food:      { pillCls: 'bg-success/10 text-success border-success/25', headerBgCls: 'bg-success', headerTextCls: 'text-white',  filterActiveCls: 'bg-success text-white border-success' },
  Nature:    { pillCls: 'bg-navy/10 text-navy border-navy/20',          headerBgCls: 'bg-navy',    headerTextCls: 'text-white',  filterActiveCls: 'bg-navy text-white border-navy' },
};

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.25, duration: 0.45 } },
};

// ── Teleport score badge ──────────────────────────────────────────────────────

const TeleportBadge = ({ city }: { city: string }) => {
  const { data, loading } = useTeleportScore(city);

  if (loading) {
    return (
      <span className="inline-block w-16 h-4 rounded-full bg-gray-100 animate-pulse" />
    );
  }
  if (!data) return null;

  const score = data.teleport_city_score;
  const color =
    score >= 70 ? 'text-success border-success/30 bg-success/10' :
    score >= 45 ? 'text-sunny-dark border-sunny/40 bg-sunny/20' :
                  'text-coral border-coral/25 bg-coral/10';

  return (
    <span
      title={`Teleport city quality score: ${score}/100`}
      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}
    >
      {score}/100
    </span>
  );
};

// ── Destination card ──────────────────────────────────────────────────────────

interface DestinationCardProps {
  destination: Destination;
  onPlanTrip: (dest: string) => void;
}

const DestinationCard = ({ destination, onPlanTrip }: DestinationCardProps) => {
  const config = TAG_CONFIG[destination.tag];
  const fullDestination = `${destination.city}, ${destination.country}`;

  return (
    <motion.div
      variants={cardVariants}
      layout
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col"
    >
      {/* Coloured header */}
      <div className={`${config.headerBgCls} px-5 py-5 flex flex-col justify-end min-h-[88px]`}>
        <p className={`text-xl font-extrabold leading-tight ${config.headerTextCls}`}>
          {destination.city}
        </p>
        <p className={`text-sm font-semibold mt-0.5 opacity-80 ${config.headerTextCls}`}>
          {destination.country}
        </p>
      </div>

      {/* Body */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <p className="text-sm text-gray leading-relaxed flex-1">{destination.description}</p>

        {/* Teleport score */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray">City score:</span>
          <TeleportBadge city={destination.city} />
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Tag pill */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.pillCls}`}>
            {destination.tag}
          </span>

          {/* CTA */}
          <motion.button
            onClick={() => onPlanTrip(fullDestination)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-3 py-1.5 rounded-full bg-ocean text-white text-xs font-bold
                       shadow-sm shadow-ocean/25 hover:bg-ocean-dark transition-colors duration-150 cursor-pointer"
          >
            Plan this trip
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ExplorePage = ({ token, onPlanTrip }: ExplorePageProps) => {
  const [search,    setSearch]    = useState('');
  const [activeTag, setActiveTag] = useState<'All' | DestinationTag>('All');

  const filtered = DESTINATIONS.filter((d) => {
    const matchesTag = activeTag === 'All' || d.tag === activeTag;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.tag.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q);
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-extrabold text-navy">Explore</h2>
        <p className="text-sm text-gray mt-0.5">Find your next adventure and start planning instantly.</p>
      </div>

      {/* ── Flight Search (Amadeus) ── */}
      <FlightSearch token={token} onPlanTrip={onPlanTrip} />

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-xs text-gray font-semibold uppercase tracking-widest">Curated Destinations</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      {/* ── Search + filter row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search destinations..."
          className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm text-navy
                     placeholder:text-gray focus:outline-none focus:ring-2 focus:ring-ocean/35 focus:border-ocean
                     transition-all duration-150"
        />

        <div className="flex gap-1.5 flex-wrap">
          {ALL_TAGS.map((tag) => {
            const isActive = activeTag === tag;
            const activeCls =
              tag === 'All'
                ? 'bg-navy text-white border-navy'
                : TAG_CONFIG[tag].filterActiveCls;
            const inactiveCls =
              tag === 'All'
                ? 'bg-gray-100 text-gray border-gray-200 hover:bg-gray-200'
                : `${TAG_CONFIG[tag].pillCls} hover:opacity-80`;

            return (
              <motion.button
                key={tag}
                onClick={() => setActiveTag(tag)}
                whileTap={{ scale: 0.93 }}
                className={[
                  'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer',
                  isActive ? activeCls : inactiveCls,
                ].join(' ')}
              >
                {tag}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Results count ── */}
      <p className="text-xs text-gray font-medium">
        {filtered.length} {filtered.length === 1 ? 'destination' : 'destinations'}
        &nbsp;·&nbsp;
        <span title="Live quality scores from Teleport API">City scores via Teleport</span>
      </p>

      {/* ── Grid ── */}
      {filtered.length > 0 ? (
        <motion.div
          key={`${activeTag}-${search}`}
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          {filtered.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} onPlanTrip={onPlanTrip} />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed border-gray-200 rounded-2xl text-center">
          <h3 className="text-lg font-bold text-navy">No matches found</h3>
          <p className="text-sm text-gray">Try a different search or clear the filter.</p>
          <motion.button
            onClick={() => { setSearch(''); setActiveTag('All'); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 rounded-full bg-silver text-navy text-sm font-semibold hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Clear filters
          </motion.button>
        </div>
      )}
    </div>
  );
};
