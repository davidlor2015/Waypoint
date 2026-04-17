import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightSearch } from '../search';
import { useTeleportScore } from '../../shared/hooks/useTeleportScore';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useAllTeleportScores } from '../../shared/hooks/useAllTeleportScores';
import { WishlistButton } from '../../shared/ui';

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
  imageUrl: string;
}

// ── Static data ───────────────────────────────────────────────────────────────

const DESTINATIONS: Destination[] = [
  { id: 'tokyo',      city: 'Tokyo',        country: 'Japan',        tag: 'Culture',   description: 'Neon lights, ancient temples, and world-class ramen.',               imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80&auto=format&fit=crop' },
  { id: 'bali',       city: 'Bali',         country: 'Indonesia',    tag: 'Beach',     description: 'Terraced rice fields, hidden temples, and turquoise surf.',           imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80&auto=format&fit=crop' },
  { id: 'paris',      city: 'Paris',        country: 'France',       tag: 'Culture',   description: 'Café culture, art museums, and a tower lit at midnight.',             imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80&auto=format&fit=crop' },
  { id: 'patagonia',  city: 'Patagonia',    country: 'Argentina',    tag: 'Adventure', description: 'Glaciers, granite towers, and trails with no mobile signal.',         imageUrl: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=80&auto=format&fit=crop' },
  { id: 'barcelona',  city: 'Barcelona',    country: 'Spain',        tag: 'Food',      description: 'Tapas bars, modernist architecture, and late-night markets.',         imageUrl: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=600&q=80&auto=format&fit=crop' },
  { id: 'kyoto',      city: 'Kyoto',        country: 'Japan',        tag: 'Culture',   description: 'Bamboo forests, geisha districts, and 1,600 Buddhist temples.',       imageUrl: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=600&q=80&auto=format&fit=crop' },
  { id: 'santorini',  city: 'Santorini',    country: 'Greece',       tag: 'Beach',     description: 'Blue-domed churches, cliff-top sunsets, and volcanic beaches.',       imageUrl: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80&auto=format&fit=crop' },
  { id: 'queenstown', city: 'Queenstown',   country: 'New Zealand',  tag: 'Adventure', description: 'Bungee jumping, ski slopes, and fjords around every bend.',           imageUrl: 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=600&q=80&auto=format&fit=crop' },
  { id: 'rome',       city: 'Rome',         country: 'Italy',        tag: 'Culture',   description: 'Two thousand years of history on every street corner.',               imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80&auto=format&fit=crop' },
  { id: 'marrakech',  city: 'Marrakech',    country: 'Morocco',      tag: 'Culture',   description: 'Labyrinthine souks, rooftop riads, and mint tea at sunset.',          imageUrl: 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=600&q=80&auto=format&fit=crop' },
  { id: 'costa-rica', city: 'Costa Rica',   country: 'Costa Rica',   tag: 'Nature',    description: 'Cloud forests, active volcanoes, and priceless biodiversity.',        imageUrl: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?w=600&q=80&auto=format&fit=crop' },
  { id: 'bangkok',    city: 'Bangkok',      country: 'Thailand',     tag: 'Food',      description: 'Street carts, floating markets, and flavours that hit hard.',         imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=600&q=80&auto=format&fit=crop' },
  { id: 'iceland',    city: 'Iceland',      country: 'Iceland',      tag: 'Adventure', description: 'Northern lights, lava fields, and geysers at every turn.',            imageUrl: 'https://images.unsplash.com/photo-1476610182828-09e11db7a39e?w=600&q=80&auto=format&fit=crop' },
  { id: 'amalfi',     city: 'Amalfi Coast', country: 'Italy',        tag: 'Beach',     description: 'Clifftop villages, turquoise coves, and limoncello by the sea.',      imageUrl: 'https://images.unsplash.com/photo-1533760881669-80db4d7b341b?w=600&q=80&auto=format&fit=crop' },
  { id: 'cape-town',  city: 'Cape Town',    country: 'South Africa', tag: 'Nature',    description: 'Table Mountain, penguin colonies, and the end of the world.',         imageUrl: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=600&q=80&auto=format&fit=crop' },
  { id: 'new-york',   city: 'New York',     country: 'USA',          tag: 'Culture',   description: 'Five boroughs, infinite bagels, and a skyline that delivers.',        imageUrl: 'https://images.unsplash.com/photo-1485871981521-5b1fd3805795?w=600&q=80&auto=format&fit=crop' },
];

const ALL_TAGS: Array<'All' | DestinationTag> = ['All', 'Beach', 'Culture', 'Adventure', 'Food', 'Nature'];

type SortOption = 'default' | 'az' | 'score-desc';

const SORT_LABELS: Record<SortOption, string> = {
  'default':    'Curated order',
  'az':         'A–Z',
  'score-desc': 'Top Rated',
};

const ALL_CITY_NAMES = DESTINATIONS.map((d) => d.city) as readonly string[];

// ── Tag config ────────────────────────────────────────────────────────────────

interface TagConfig {
  pillCls: string;
  filterActiveCls: string;
  fallbackBgCls: string;
  fallbackTextCls: string;
}

const TAG_CONFIG: Record<DestinationTag, TagConfig> = {
  Beach:     { pillCls: 'bg-amber/15 text-amber border-amber/30',          filterActiveCls: 'bg-amber text-white border-amber',         fallbackBgCls: 'bg-amber',    fallbackTextCls: 'text-white'  },
  Culture:   { pillCls: 'bg-clay/15 text-clay border-clay/25',             filterActiveCls: 'bg-clay text-white border-clay',           fallbackBgCls: 'bg-clay',     fallbackTextCls: 'text-white'  },
  Adventure: { pillCls: 'bg-espresso/10 text-espresso border-espresso/20', filterActiveCls: 'bg-espresso text-ivory border-espresso',   fallbackBgCls: 'bg-espresso', fallbackTextCls: 'text-ivory'  },
  Food:      { pillCls: 'bg-amber/15 text-amber border-amber/30',          filterActiveCls: 'bg-amber text-white border-amber',         fallbackBgCls: 'bg-amber',    fallbackTextCls: 'text-white'  },
  Nature:    { pillCls: 'bg-olive/10 text-olive border-olive/20',          filterActiveCls: 'bg-olive text-white border-olive',         fallbackBgCls: 'bg-olive',    fallbackTextCls: 'text-white'  },
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
    return <span className="inline-block w-16 h-4 rounded-full bg-parchment animate-pulse" />;
  }
  if (!data) return null;

  const score = data.teleport_city_score;
  const color =
    score >= 70 ? 'text-olive border-olive/30 bg-olive/10' :
    score >= 45 ? 'text-amber border-amber/40 bg-amber/15' :
                  'text-danger border-danger/25 bg-danger/10';

  return (
    <span
      title={`Teleport city quality score: ${score}/100`}
      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}
    >
      {score}/100
    </span>
  );
};

// ── Featured hero ─────────────────────────────────────────────────────────────

interface FeaturedHeroProps {
  destination: Destination;
  onPlanTrip: (dest: string) => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
}

const FeaturedHero = ({ destination, onPlanTrip, isSaved, onToggleWishlist }: FeaturedHeroProps) => {
  const [imgError, setImgError] = useState(false);
  const config = TAG_CONFIG[destination.tag];
  const fullDestination = `${destination.city}, ${destination.country}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
      className="group relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md"
    >
      {imgError ? (
        <div className={`w-full h-full ${config.fallbackBgCls}`} />
      ) : (
        <>
          <img
            src={destination.imageUrl}
            alt={destination.city}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        </>
      )}

      {/* Top bar */}
      <div className="absolute top-4 left-5 right-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-white/60">
          Featured Destination
        </span>
        <WishlistButton isSaved={isSaved} onToggle={onToggleWishlist} />
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 sm:px-7 sm:pb-6 flex flex-col gap-2">
        <div>
          <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-none drop-shadow-sm">
            {destination.city}
          </p>
          <p className="text-base font-semibold text-white/70 mt-1">{destination.country}</p>
        </div>
        <p className="hidden sm:block text-sm text-white/80 leading-relaxed max-w-lg">
          {destination.description}
        </p>
        <div className="flex items-center gap-2.5 flex-wrap mt-1">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
            {destination.tag}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/60">Score:</span>
            <TeleportBadge city={destination.city} />
          </div>
          <motion.button
            onClick={() => onPlanTrip(fullDestination)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="ml-auto px-4 py-2 rounded-full bg-amber text-white text-sm font-bold
                       shadow-sm shadow-amber/30 hover:bg-amber-dark transition-colors duration-150 cursor-pointer"
          >
            Plan this trip
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Destination card ──────────────────────────────────────────────────────────

interface DestinationCardProps {
  destination: Destination;
  onPlanTrip: (dest: string) => void;
  onViewDetails: (dest: Destination) => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
}

const DestinationCard = ({ destination, onPlanTrip, onViewDetails, isSaved, onToggleWishlist }: DestinationCardProps) => {
  const [imgError, setImgError] = useState(false);
  const config = TAG_CONFIG[destination.tag];
  const fullDestination = `${destination.city}, ${destination.country}`;

  return (
    <motion.div
      variants={cardVariants}
      layout
      onClick={() => onViewDetails(destination)}
      className="group bg-white rounded-2xl border border-smoke/60 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* ── Image header ── */}
      <div className="relative h-48 overflow-hidden">
        {imgError ? (
          /* Colour-block fallback when image 404s */
          <div className={`w-full h-full ${config.fallbackBgCls} flex items-end px-5 pb-4`}>
            <div>
              <p className={`text-xl font-bold font-display leading-tight ${config.fallbackTextCls}`}>
                {destination.city}
              </p>
              <p className={`text-sm font-semibold mt-0.5 opacity-80 ${config.fallbackTextCls}`}>
                {destination.country}
              </p>
            </div>
          </div>
        ) : (
          <>
            <img
              src={destination.imageUrl}
              alt={destination.city}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {/* Gradient scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            {/* City / country over image */}
            <div className="absolute bottom-0 left-0 px-4 pb-3">
              <p className="text-xl font-bold font-display text-white leading-tight drop-shadow-sm">
                {destination.city}
              </p>
              <p className="text-sm font-semibold text-white/80 drop-shadow-sm">
                {destination.country}
              </p>
            </div>
          </>
        )}

        {/* Tag pill — always visible over image or fallback */}
        <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
          {destination.tag}
        </span>

        {/* Wishlist bookmark — top right */}
        <WishlistButton
          isSaved={isSaved}
          onToggle={onToggleWishlist}
          className="absolute top-3 right-3"
        />
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        <p className="text-sm text-flint leading-relaxed flex-1">{destination.description}</p>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-flint">City score:</span>
          <TeleportBadge city={destination.city} />
        </div>

        <div className="flex items-center justify-end">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onPlanTrip(fullDestination); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-3 py-1.5 rounded-full bg-amber text-white text-xs font-bold
                       shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150 cursor-pointer"
          >
            Plan this trip
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Destination modal ─────────────────────────────────────────────────────────

interface DestinationModalProps {
  destination: Destination;
  onClose: () => void;
  onPlanTrip: (dest: string) => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
}

const modalBackdropVariants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1 },
};

const modalPanelVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1,   transition: { type: 'spring' as const, bounce: 0.22, duration: 0.5 } },
  exit:   { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } },
};

const DestinationModal = ({ destination, onClose, onPlanTrip, isSaved, onToggleWishlist }: DestinationModalProps) => {
  const [imgError, setImgError] = useState(false);
  const { data, loading } = useTeleportScore(destination.city);
  const config = TAG_CONFIG[destination.tag];
  const fullDestination = `${destination.city}, ${destination.country}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={modalBackdropVariants}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={destination.city}
        variants={modalPanelVariants}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-smoke/60 shadow-2xl
                   max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* ── Image header ── */}
        <div className="relative h-56 sm:h-72 shrink-0 overflow-hidden rounded-t-2xl">
          {imgError ? (
            <div className={`w-full h-full ${config.fallbackBgCls}`} />
          ) : (
            <>
              <img
                src={destination.imageUrl}
                alt={destination.city}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            </>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-3 right-3 p-1.5 rounded-full bg-white/90 backdrop-blur-sm
                       text-flint hover:text-espresso shadow-sm transition-colors cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Tag pill */}
          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
            {destination.tag}
          </span>

          {/* Wishlist */}
          <WishlistButton isSaved={isSaved} onToggle={onToggleWishlist} className="absolute top-10 right-3 mt-1" />

          {/* City / country */}
          {!imgError && (
            <div className="absolute bottom-0 left-0 px-6 pb-5">
              <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-none drop-shadow-sm">
                {destination.city}
              </p>
              <p className="text-base font-semibold text-white/75 mt-1">{destination.country}</p>
            </div>
          )}
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-6 flex flex-col gap-6">

          {/* Description */}
          <p className="text-base text-flint leading-relaxed">{destination.description}</p>

          {/* Teleport score section */}
          {loading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 rounded-full bg-parchment animate-pulse" style={{ width: `${65 + (i % 3) * 12}%` }} />
              ))}
            </div>
          )}

          {!loading && data && (
            <div className="flex flex-col gap-4">
              {/* Aggregate score */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-espresso">{data.teleport_city_score}</span>
                <span className="text-sm text-flint">/100 city score</span>
                <div className="flex-1 h-2 bg-smoke rounded-full overflow-hidden ml-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.teleport_city_score}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      data.teleport_city_score >= 70 ? 'bg-olive' :
                      data.teleport_city_score >= 45 ? 'bg-amber' : 'bg-danger'
                    }`}
                  />
                </div>
              </div>

              {/* Category bars */}
              {data.categories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {data.categories.map((cat) => {
                    const barCls =
                      cat.score_out_of_10 >= 7 ? 'bg-olive' :
                      cat.score_out_of_10 >= 4 ? 'bg-amber' : 'bg-danger';
                    return (
                      <div key={cat.name}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-xs font-semibold text-espresso">{cat.name}</span>
                          <span className="text-xs text-flint tabular-nums">{cat.score_out_of_10.toFixed(1)}</span>
                        </div>
                        <div className="h-1.5 bg-smoke rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(cat.score_out_of_10 / 10) * 100}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
                            className={`h-full rounded-full ${barCls}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          <div className="flex justify-end pt-2 border-t border-smoke">
            <motion.button
              onClick={() => { onPlanTrip(fullDestination); onClose(); }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="px-6 py-2.5 rounded-full bg-amber text-white text-sm font-bold
                         shadow-sm shadow-amber/25 hover:bg-amber-dark transition-colors duration-150 cursor-pointer"
            >
              Plan this trip
            </motion.button>
          </div>

        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const ExplorePage = ({ token, onPlanTrip }: ExplorePageProps) => {
  const [search,             setSearch]             = useState('');
  const [activeTag,          setActiveTag]          = useState<'All' | DestinationTag>('All');
  const [showSavedOnly,      setShowSavedOnly]      = useState(false);
  const [sort,               setSort]               = useState<SortOption>('default');
  const [selectedDest,       setSelectedDest]       = useState<Destination | null>(null);
  const { savedIds, toggle, isSaved }    = useWishlist();
  const [featured]                       = useState<Destination>(
    () => DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
  );

  // Only fetch all scores when the user actually chooses Top Rated
  const { scores, loading: scoresLoading } = useAllTeleportScores(
    sort === 'score-desc' ? ALL_CITY_NAMES : [],
  );

  const filtered = useMemo(() => {
    const base = DESTINATIONS.filter((d) => {
      if (showSavedOnly && !savedIds.has(d.id)) return false;
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

    if (sort === 'az') {
      return [...base].sort((a, b) => a.city.localeCompare(b.city));
    }
    if (sort === 'score-desc') {
      return [...base].sort((a, b) => (scores.get(b.city) ?? -1) - (scores.get(a.city) ?? -1));
    }
    return base;
  }, [search, activeTag, showSavedOnly, savedIds, sort, scores]);

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-espresso">Explore</h2>
        <p className="text-sm text-flint mt-0.5">Find your next adventure and start planning instantly.</p>
      </div>

      {/* ── Flight Search (Amadeus) ── */}
      <FlightSearch token={token} onPlanTrip={onPlanTrip} />

      {/* ── Divider ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-smoke/50" />
        <span className="text-xs text-flint font-semibold uppercase tracking-widest">Curated Destinations</span>
        <div className="flex-1 h-px bg-smoke/50" />
      </div>

      {/* ── Featured hero ── */}
      <FeaturedHero
        destination={featured}
        onPlanTrip={onPlanTrip}
        isSaved={isSaved(featured.id)}
        onToggleWishlist={() => toggle(featured.id)}
      />

      {/* ── Search + filter row ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search destinations..."
          className="flex-1 px-4 py-2.5 rounded-full border border-smoke bg-white text-sm text-espresso
                     placeholder:text-flint focus:outline-none focus:ring-2 focus:ring-amber/35 focus:border-amber
                     transition-all duration-150"
        />

        <div className="flex gap-1.5 flex-wrap">
          {ALL_TAGS.map((tag) => {
            const isActive = activeTag === tag;
            const activeCls =
              tag === 'All'
                ? 'bg-espresso text-white border-espresso'
                : TAG_CONFIG[tag].filterActiveCls;
            const inactiveCls =
              tag === 'All'
                ? 'bg-parchment text-flint border-smoke hover:bg-smoke'
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

          {savedIds.size > 0 && (
            <>
              <span className="self-center w-px h-4 bg-smoke" />
              <motion.button
                onClick={() => setShowSavedOnly((v) => !v)}
                whileTap={{ scale: 0.93 }}
                className={[
                  'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer flex items-center gap-1.5',
                  showSavedOnly
                    ? 'bg-amber text-white border-amber'
                    : 'bg-parchment text-flint border-smoke hover:bg-smoke',
                ].join(' ')}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3" fill={showSavedOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
                Saved ({savedIds.size})
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* ── Results count + sort ── */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-flint font-medium">
          {filtered.length} {filtered.length === 1 ? 'destination' : 'destinations'}
          &nbsp;·&nbsp;
          <span title="Live quality scores from Teleport API">City scores via Teleport</span>
        </p>

        <div className="flex items-center gap-2 shrink-0">
          {scoresLoading && (
            <span className="w-3 h-3 rounded-full border-2 border-amber border-t-transparent animate-spin" />
          )}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-xs text-flint font-semibold bg-white border border-smoke rounded-full
                       px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber/35
                       focus:border-amber transition-all duration-150"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

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
            <DestinationCard
              key={dest.id}
              destination={dest}
              onPlanTrip={onPlanTrip}
              onViewDetails={setSelectedDest}
              isSaved={isSaved(dest.id)}
              onToggleWishlist={() => toggle(dest.id)}
            />
          ))}
        </motion.div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20 border-2 border-dashed border-smoke rounded-2xl text-center">
          <h3 className="text-lg font-bold text-espresso">No matches found</h3>
          <p className="text-sm text-flint">Try a different search or clear the filter.</p>
          <motion.button
            onClick={() => { setSearch(''); setActiveTag('All'); }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 rounded-full bg-parchment text-espresso text-sm font-semibold hover:bg-smoke transition-colors cursor-pointer"
          >
            Clear filters
          </motion.button>
        </div>
      )}
      {/* ── Destination detail modal ── */}
      <AnimatePresence>
        {selectedDest && (
          <DestinationModal
            destination={selectedDest}
            onClose={() => setSelectedDest(null)}
            onPlanTrip={onPlanTrip}
            isSaved={isSaved(selectedDest.id)}
            onToggleWishlist={() => toggle(selectedDest.id)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
