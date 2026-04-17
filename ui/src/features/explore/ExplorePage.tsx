import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlightSearch } from '../search';
import { useTeleportScoreBySlug } from '../../shared/hooks/useTeleportScoreBySlug';
import { useTeleportCityImage } from '../../shared/hooks/useTeleportCityImage';
import { useWishlist } from '../../shared/hooks/useWishlist';
import { useAllTeleportScores } from '../../shared/hooks/useAllTeleportScores';
import { useTeleportRegionCities, type Region } from '../../shared/hooks/useTeleportRegionCities';
import { WishlistButton } from '../../shared/ui';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExplorePageProps {
  token: string;
  onPlanTrip: (destination: string) => void;
}

type DestinationTag = 'Beach' | 'Culture' | 'Adventure' | 'Food' | 'Nature';

interface Destination {
  id: string;           // Teleport slug
  city: string;
  country: string;
  tag?: DestinationTag;
  description?: string;
}

// ── Static popular data ───────────────────────────────────────────────────────

const POPULAR_DESTINATIONS: Destination[] = [
  { id: 'tokyo',      city: 'Tokyo',        country: 'Japan',        tag: 'Culture',   description: 'Neon lights, ancient temples, and world-class ramen.'          },
  { id: 'bali',       city: 'Bali',         country: 'Indonesia',    tag: 'Beach',     description: 'Terraced rice fields, hidden temples, and turquoise surf.'      },
  { id: 'paris',      city: 'Paris',        country: 'France',       tag: 'Culture',   description: 'Café culture, art museums, and a tower lit at midnight.'        },
  { id: 'barcelona',  city: 'Barcelona',    country: 'Spain',        tag: 'Food',      description: 'Tapas bars, modernist architecture, and late-night markets.'    },
  { id: 'kyoto',      city: 'Kyoto',        country: 'Japan',        tag: 'Culture',   description: 'Bamboo forests, geisha districts, and 1,600 Buddhist temples.'  },
  { id: 'santorini',  city: 'Santorini',    country: 'Greece',       tag: 'Beach',     description: 'Blue-domed churches, cliff-top sunsets, and volcanic beaches.'  },
  { id: 'queenstown', city: 'Queenstown',   country: 'New Zealand',  tag: 'Adventure', description: 'Bungee jumping, ski slopes, and fjords around every bend.'      },
  { id: 'rome',       city: 'Rome',         country: 'Italy',        tag: 'Culture',   description: 'Two thousand years of history on every street corner.'          },
  { id: 'marrakech',  city: 'Marrakech',    country: 'Morocco',      tag: 'Culture',   description: 'Labyrinthine souks, rooftop riads, and mint tea at sunset.'     },
  { id: 'bangkok',    city: 'Bangkok',      country: 'Thailand',     tag: 'Food',      description: 'Street carts, floating markets, and flavours that hit hard.'    },
  { id: 'reykjavik',  city: 'Reykjavik',    country: 'Iceland',      tag: 'Adventure', description: 'Northern lights, lava fields, and geysers at every turn.'       },
  { id: 'cape-town',  city: 'Cape Town',    country: 'South Africa', tag: 'Nature',    description: 'Table Mountain, penguin colonies, and the end of the world.'    },
  { id: 'new-york',   city: 'New York',     country: 'USA',          tag: 'Culture',   description: 'Five boroughs, infinite bagels, and a skyline that delivers.'   },
  { id: 'auckland',   city: 'Auckland',     country: 'New Zealand',  tag: 'Nature',    description: 'Volcanic islands, harbour cruises, and world-class hiking.'     },
  { id: 'amsterdam',  city: 'Amsterdam',    country: 'Netherlands',  tag: 'Culture',   description: 'Canals, cycling culture, and world-class museums.'              },
  { id: 'dubai',      city: 'Dubai',        country: 'UAE',          tag: 'Adventure', description: 'Skyscrapers, desert dunes, and tax-free shopping malls.'        },
  { id: 'singapore',  city: 'Singapore',    country: 'Singapore',    tag: 'Food',      description: 'Hawker centres, sky gardens, and seamless modernity.'           },
  { id: 'lisbon',     city: 'Lisbon',       country: 'Portugal',     tag: 'Culture',   description: 'Trams, pastel tiles, and the best custard tarts in the world.'  },
  { id: 'sydney',     city: 'Sydney',       country: 'Australia',    tag: 'Beach',     description: 'Harbour icons, golden beaches, and world-class surf.'           },
  { id: 'vienna',     city: 'Vienna',       country: 'Austria',      tag: 'Culture',   description: 'Imperial grandeur, coffee houses, and Mozart at every corner.'  },
];

// ── Region config ─────────────────────────────────────────────────────────────

const REGION_LABELS: Record<Region, string> = {
  popular:  'Popular',
  europe:   'Europe',
  asia:     'Asia',
  americas: 'Americas',
  africa:   'Africa',
  oceania:  'Oceania',
};

const ALL_REGIONS: Region[] = ['popular', 'europe', 'asia', 'americas', 'africa', 'oceania'];

// ── Tag config ────────────────────────────────────────────────────────────────

const ALL_TAGS: Array<'All' | DestinationTag> = ['All', 'Beach', 'Culture', 'Adventure', 'Food', 'Nature'];

interface TagConfig {
  pillCls: string;
  filterActiveCls: string;
  fallbackBgCls: string;
  fallbackTextCls: string;
}

const TAG_CONFIG: Record<DestinationTag, TagConfig> = {
  Beach:     { pillCls: 'bg-amber/15 text-amber border-amber/30',          filterActiveCls: 'bg-amber text-white border-amber',       fallbackBgCls: 'bg-amber',    fallbackTextCls: 'text-white' },
  Culture:   { pillCls: 'bg-clay/15 text-clay border-clay/25',             filterActiveCls: 'bg-clay text-white border-clay',         fallbackBgCls: 'bg-clay',     fallbackTextCls: 'text-white' },
  Adventure: { pillCls: 'bg-espresso/10 text-espresso border-espresso/20', filterActiveCls: 'bg-espresso text-ivory border-espresso', fallbackBgCls: 'bg-espresso', fallbackTextCls: 'text-ivory' },
  Food:      { pillCls: 'bg-amber/15 text-amber border-amber/30',          filterActiveCls: 'bg-amber text-white border-amber',       fallbackBgCls: 'bg-amber',    fallbackTextCls: 'text-white' },
  Nature:    { pillCls: 'bg-olive/10 text-olive border-olive/20',          filterActiveCls: 'bg-olive text-white border-olive',       fallbackBgCls: 'bg-olive',    fallbackTextCls: 'text-white' },
};

const DEFAULT_FALLBACK = { fallbackBgCls: 'bg-espresso', fallbackTextCls: 'text-ivory', filterActiveCls: 'bg-espresso text-ivory border-espresso', pillCls: '' };

// ── Sort config ───────────────────────────────────────────────────────────────

type SortOption = 'default' | 'az' | 'score-desc';

const SORT_LABELS: Record<SortOption, string> = {
  'default':    'Curated order',
  'az':         'A–Z',
  'score-desc': 'Top Rated',
};

// ── Animation variants ────────────────────────────────────────────────────────

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.25, duration: 0.45 } },
};

// ── Score badge ───────────────────────────────────────────────────────────────

const TeleportBadge = ({ slug }: { slug: string }) => {
  const { data, loading } = useTeleportScoreBySlug(slug);

  if (loading) return <span className="inline-block w-16 h-4 rounded-full bg-parchment animate-pulse" />;
  if (!data) return null;

  const score = data.teleport_city_score;
  const color =
    score >= 70 ? 'text-olive border-olive/30 bg-olive/10' :
    score >= 45 ? 'text-amber border-amber/40 bg-amber/15' :
                  'text-danger border-danger/25 bg-danger/10';

  return (
    <span title={`Teleport city quality score: ${score}/100`} className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {score}/100
    </span>
  );
};

// ── Skeleton card ─────────────────────────────────────────────────────────────

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-smoke/60 shadow-sm overflow-hidden animate-pulse">
    <div className="h-48 bg-parchment" />
    <div className="px-5 py-4 space-y-2">
      <div className="h-4 bg-smoke rounded-full w-2/3" />
      <div className="h-3 bg-parchment rounded-full w-full" />
      <div className="h-3 bg-parchment rounded-full w-3/4" />
    </div>
  </div>
);

// ── Featured hero ─────────────────────────────────────────────────────────────

interface FeaturedHeroProps {
  destination: Destination;
  onPlanTrip: (dest: string) => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
}

const FeaturedHero = ({ destination, onPlanTrip, isSaved, onToggleWishlist }: FeaturedHeroProps) => {
  const { imageUrl, loading: imgLoading } = useTeleportCityImage(destination.city);
  const [imgError, setImgError] = useState(false);
  const config = destination.tag ? TAG_CONFIG[destination.tag] : DEFAULT_FALLBACK;
  const fullDestination = `${destination.city}, ${destination.country}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
      className="group relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md"
    >
      {imgLoading ? (
        <div className="w-full h-full bg-parchment animate-pulse" />
      ) : imgError || !imageUrl ? (
        <div className={`w-full h-full ${config.fallbackBgCls}`} />
      ) : (
        <>
          <img
            src={imageUrl}
            alt={destination.city}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        </>
      )}

      <div className="absolute top-4 left-5 right-4 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-white/60">Featured Destination</span>
        <WishlistButton isSaved={isSaved} onToggle={onToggleWishlist} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 sm:px-7 sm:pb-6 flex flex-col gap-2">
        <div>
          <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-none drop-shadow-sm">
            {destination.city}
          </p>
          <p className="text-base font-semibold text-white/70 mt-1">{destination.country}</p>
        </div>
        {destination.description && (
          <p className="hidden sm:block text-sm text-white/80 leading-relaxed max-w-lg">
            {destination.description}
          </p>
        )}
        <div className="flex items-center gap-2.5 flex-wrap mt-1">
          {destination.tag && (
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
              {destination.tag}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/60">Score:</span>
            <TeleportBadge slug={destination.id} />
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
  const { imageUrl, loading: imgLoading } = useTeleportCityImage(destination.city);
  const [imgError, setImgError] = useState(false);
  const config = destination.tag ? TAG_CONFIG[destination.tag] : DEFAULT_FALLBACK;
  const fullDestination = destination.country
    ? `${destination.city}, ${destination.country}`
    : destination.city;

  const showFallback = !imgLoading && (imgError || !imageUrl);

  return (
    <motion.div
      variants={cardVariants}
      layout
      onClick={() => onViewDetails(destination)}
      className="group bg-white rounded-2xl border border-smoke/60 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden flex flex-col cursor-pointer"
    >
      {/* ── Image header ── */}
      <div className="relative h-48 overflow-hidden bg-parchment">
        {imgLoading && <div className="w-full h-full animate-pulse bg-parchment" />}

        {!imgLoading && showFallback && (
          <div className={`w-full h-full ${config.fallbackBgCls} flex items-end px-5 pb-4`}>
            <div>
              <p className={`text-xl font-bold font-display leading-tight ${config.fallbackTextCls}`}>{destination.city}</p>
              {destination.country && (
                <p className={`text-sm font-semibold mt-0.5 opacity-80 ${config.fallbackTextCls}`}>{destination.country}</p>
              )}
            </div>
          </div>
        )}

        {!imgLoading && !showFallback && (
          <>
            <img
              src={imageUrl!}
              alt={destination.city}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 px-4 pb-3">
              <p className="text-xl font-bold font-display text-white leading-tight drop-shadow-sm">{destination.city}</p>
              {destination.country && (
                <p className="text-sm font-semibold text-white/80 drop-shadow-sm">{destination.country}</p>
              )}
            </div>
          </>
        )}

        {destination.tag && (
          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
            {destination.tag}
          </span>
        )}

        <WishlistButton isSaved={isSaved} onToggle={onToggleWishlist} className="absolute top-3 right-3" />
      </div>

      {/* ── Body ── */}
      <div className="px-5 py-4 flex flex-col gap-3 flex-1">
        {destination.description ? (
          <p className="text-sm text-flint leading-relaxed flex-1">{destination.description}</p>
        ) : (
          <p className="text-sm text-flint/50 italic flex-1">No description available.</p>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-flint">City score:</span>
          <TeleportBadge slug={destination.id} />
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

const modalBackdropVariants = { hidden: { opacity: 0 }, show: { opacity: 1 } };
const modalPanelVariants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { type: 'spring' as const, bounce: 0.22, duration: 0.5 } },
  exit:   { opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } },
};

const DestinationModal = ({ destination, onClose, onPlanTrip, isSaved, onToggleWishlist }: DestinationModalProps) => {
  const { imageUrl, loading: imgLoading } = useTeleportCityImage(destination.city);
  const [imgError, setImgError] = useState(false);
  const { data, loading: scoreLoading } = useTeleportScoreBySlug(destination.id);
  const config = destination.tag ? TAG_CONFIG[destination.tag] : DEFAULT_FALLBACK;
  const fullDestination = destination.country
    ? `${destination.city}, ${destination.country}`
    : destination.city;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const showFallback = !imgLoading && (imgError || !imageUrl);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      variants={modalBackdropVariants}
      initial="hidden"
      animate="show"
      exit="hidden"
      transition={{ duration: 0.2 }}
    >
      <div className="absolute inset-0 bg-espresso/50 backdrop-blur-sm" aria-hidden="true" onClick={onClose} />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={destination.city}
        variants={modalPanelVariants}
        className="relative z-10 w-full max-w-2xl bg-white rounded-2xl border border-smoke/60 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Image header */}
        <div className="relative h-56 sm:h-72 shrink-0 overflow-hidden rounded-t-2xl bg-parchment">
          {imgLoading && <div className="w-full h-full animate-pulse bg-parchment" />}

          {!imgLoading && showFallback && (
            <div className={`w-full h-full ${config.fallbackBgCls}`} />
          )}

          {!imgLoading && !showFallback && (
            <>
              <img
                src={imageUrl!}
                alt={destination.city}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            </>
          )}

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

          {destination.tag && (
            <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full border ${config.filterActiveCls}`}>
              {destination.tag}
            </span>
          )}

          <WishlistButton isSaved={isSaved} onToggle={onToggleWishlist} className="absolute top-10 right-3 mt-1" />

          {!showFallback && !imgLoading && (
            <div className="absolute bottom-0 left-0 px-6 pb-5">
              <p className="text-4xl sm:text-5xl font-display font-bold text-white leading-none drop-shadow-sm">
                {destination.city}
              </p>
              {destination.country && (
                <p className="text-base font-semibold text-white/75 mt-1">{destination.country}</p>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6 flex flex-col gap-6">
          {destination.description && (
            <p className="text-base text-flint leading-relaxed">{destination.description}</p>
          )}

          {scoreLoading && (
            <div className="space-y-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 rounded-full bg-parchment animate-pulse" style={{ width: `${65 + (i % 3) * 12}%` }} />
              ))}
            </div>
          )}

          {!scoreLoading && data && (
            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-bold text-espresso">{data.teleport_city_score}</span>
                <span className="text-sm text-flint">/100 city score</span>
                <div className="flex-1 h-2 bg-smoke rounded-full overflow-hidden ml-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${data.teleport_city_score}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className={`h-full rounded-full ${data.teleport_city_score >= 70 ? 'bg-olive' : data.teleport_city_score >= 45 ? 'bg-amber' : 'bg-danger'}`}
                  />
                </div>
              </div>

              {data.categories.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                  {data.categories.map((cat) => {
                    const barCls = cat.score_out_of_10 >= 7 ? 'bg-olive' : cat.score_out_of_10 >= 4 ? 'bg-amber' : 'bg-danger';
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
  const [search,        setSearch]        = useState('');
  const [activeTag,     setActiveTag]     = useState<'All' | DestinationTag>('All');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sort,          setSort]          = useState<SortOption>('default');
  const [activeRegion,  setActiveRegion]  = useState<Region>('popular');
  const [selectedDest,  setSelectedDest]  = useState<Destination | null>(null);

  const { savedIds, toggle, isSaved } = useWishlist();
  const [featured] = useState<Destination>(
    () => POPULAR_DESTINATIONS[Math.floor(Math.random() * POPULAR_DESTINATIONS.length)],
  );

  const { cities: regionCities, loading: regionLoading, error: regionError } =
    useTeleportRegionCities(activeRegion);

  const destinations: Destination[] = useMemo(
    () =>
      activeRegion === 'popular'
        ? POPULAR_DESTINATIONS
        : regionCities.map((c) => ({ id: c.id, city: c.city, country: '' })),
    [activeRegion, regionCities],
  );

  // Reset tag filter when switching away from popular (tags don't exist on region cities)
  useEffect(() => {
    if (activeRegion !== 'popular') {
      setActiveTag('All');
      if (sort === 'default') setSort('az');
    } else {
      setSort('default');
    }
  }, [activeRegion]);

  const sortSlugs = sort === 'score-desc' ? destinations.map((d) => d.id) : [];
  const { scores, loading: scoresLoading } = useAllTeleportScores(sortSlugs);

  const filtered = useMemo(() => {
    const base = destinations.filter((d) => {
      if (showSavedOnly && !savedIds.has(d.id)) return false;
      if (activeTag !== 'All' && d.tag !== activeTag) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        d.city.toLowerCase().includes(q) ||
        d.country.toLowerCase().includes(q) ||
        (d.tag?.toLowerCase().includes(q) ?? false) ||
        (d.description?.toLowerCase().includes(q) ?? false)
      );
    });

    if (sort === 'az') return [...base].sort((a, b) => a.city.localeCompare(b.city));
    if (sort === 'score-desc') return [...base].sort((a, b) => (scores.get(b.id) ?? -1) - (scores.get(a.id) ?? -1));
    return base;
  }, [destinations, search, activeTag, showSavedOnly, savedIds, sort, scores]);

  const availableSorts: SortOption[] = activeRegion === 'popular'
    ? ['default', 'az', 'score-desc']
    : ['az', 'score-desc'];

  return (
    <div className="space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-espresso">Explore</h2>
        <p className="text-sm text-flint mt-0.5">Find your next adventure and start planning instantly.</p>
      </div>

      {/* Flight Search */}
      <FlightSearch token={token} onPlanTrip={onPlanTrip} />

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-smoke/50" />
        <span className="text-xs text-flint font-semibold uppercase tracking-widest">
          {activeRegion === 'popular' ? 'Popular Destinations' : REGION_LABELS[activeRegion]}
        </span>
        <div className="flex-1 h-px bg-smoke/50" />
      </div>

      {/* Featured hero — always from popular set */}
      <FeaturedHero
        destination={featured}
        onPlanTrip={onPlanTrip}
        isSaved={isSaved(featured.id)}
        onToggleWishlist={() => toggle(featured.id)}
      />

      {/* Region filter row */}
      <div className="flex gap-1.5 flex-wrap">
        {ALL_REGIONS.map((region) => {
          const isActive = activeRegion === region;
          return (
            <motion.button
              key={region}
              onClick={() => setActiveRegion(region)}
              whileTap={{ scale: 0.93 }}
              className={[
                'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer',
                isActive
                  ? 'bg-espresso text-white border-espresso'
                  : 'bg-parchment text-flint border-smoke hover:bg-smoke',
              ].join(' ')}
            >
              {REGION_LABELS[region]}
            </motion.button>
          );
        })}
      </div>

      {/* Tag + search filter row — tags only for popular */}
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
          <AnimatePresence initial={false}>
            {activeRegion === 'popular' && ALL_TAGS.map((tag) => {
              const isActive = activeTag === tag;
              const activeCls  = tag === 'All' ? 'bg-espresso text-white border-espresso' : TAG_CONFIG[tag].filterActiveCls;
              const inactiveCls = tag === 'All' ? 'bg-parchment text-flint border-smoke hover:bg-smoke' : `${TAG_CONFIG[tag].pillCls} hover:opacity-80`;
              return (
                <motion.button
                  key={tag}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.15 }}
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
          </AnimatePresence>

          {savedIds.size > 0 && (
            <>
              <span className="self-center w-px h-4 bg-smoke" />
              <motion.button
                onClick={() => setShowSavedOnly((v) => !v)}
                whileTap={{ scale: 0.93 }}
                className={[
                  'text-xs font-bold px-3 py-1.5 rounded-full border transition-colors duration-150 cursor-pointer flex items-center gap-1.5',
                  showSavedOnly ? 'bg-amber text-white border-amber' : 'bg-parchment text-flint border-smoke hover:bg-smoke',
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

      {/* Results count + sort */}
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-flint font-medium">
          {regionLoading ? 'Loading…' : `${filtered.length} ${filtered.length === 1 ? 'destination' : 'destinations'}`}
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
            {availableSorts.map((opt) => (
              <option key={opt} value={opt}>{SORT_LABELS[opt]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      {regionLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : regionError ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 border-2 border-dashed border-smoke rounded-2xl text-center">
          <h3 className="text-lg font-bold text-espresso">Could not load destinations</h3>
          <p className="text-sm text-flint">{regionError}</p>
          <motion.button
            onClick={() => setActiveRegion('popular')}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-2 rounded-full bg-parchment text-espresso text-sm font-semibold hover:bg-smoke transition-colors cursor-pointer"
          >
            Back to Popular
          </motion.button>
        </div>
      ) : filtered.length > 0 ? (
        <motion.div
          key={`${activeRegion}-${activeTag}-${search}`}
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

      {/* Destination detail modal */}
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
