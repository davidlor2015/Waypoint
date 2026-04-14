import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  searchFlights,
  getInspirations,
  type FlightOffer,
  type FlightInspiration,
} from '../../shared/api/search';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlightSearchProps {
  token: string;
  onPlanTrip: (destination: string) => void;
}

type Tab = 'search' | 'inspire';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Parse ISO-8601 duration like "PT2H10M" → "2h 10m" */
function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return iso;
  const h = m[1] ? `${m[1]}h ` : '';
  const min = m[2] ? `${m[2]}m` : '';
  return `${h}${min}`.trim();
}

/** "2026-08-01T06:30:00" → "06:30" */
function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

/** "2026-08-01T06:30:00" → "1 Aug" */
function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

// ── Sub-components ────────────────────────────────────────────────────────────

const WarningIcon = () => (
  <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const TestEnvBadge = () => (
  <span
    title="This feature uses the Amadeus developer sandbox. Results are test data, not live availability."
    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold
               bg-sunny/30 text-sunny-dark border border-sunny/40 select-none"
  >
    <WarningIcon /> Amadeus Test Environment
  </span>
);

interface IataInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const IataInput = ({ id, label, value, onChange, placeholder = 'e.g. LHR' }: IataInputProps) => (
  <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-xs font-bold text-navy uppercase tracking-wide">
      {label}
    </label>
    <input
      id={id}
      type="text"
      maxLength={3}
      value={value}
      onChange={(e) => onChange(e.target.value.toUpperCase())}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-mono
                 text-navy placeholder:text-gray/60 focus:outline-none focus:ring-2
                 focus:ring-ocean/35 focus:border-ocean transition-all duration-150 uppercase"
    />
  </div>
);

// Flight result card
const FlightOfferCard = ({
  offer,
  onPlanTrip,
}: {
  offer: FlightOffer;
  onPlanTrip: (dest: string) => void;
}) => {
  const itin = offer.itineraries[0];
  const first = itin?.segments[0];
  const last = itin?.segments[itin.segments.length - 1];
  const stops = (itin?.segments.length ?? 1) - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap"
    >
      {/* Route */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-center">
          <p className="text-lg font-extrabold text-navy leading-none">{first?.departure_iata}</p>
          <p className="text-xs text-gray">{first ? formatTime(first.departure_at) : '—'}</p>
          <p className="text-xs text-gray">{first ? formatShortDate(first.departure_at) : ''}</p>
        </div>

        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-[80px]">
          <p className="text-xs text-gray">{formatDuration(itin?.duration ?? '')}</p>
          <div className="flex items-center w-full gap-1">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs">✈</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-xs text-gray">{stops === 0 ? 'Direct' : `${stops} stop${stops > 1 ? 's' : ''}`}</p>
        </div>

        <div className="text-center">
          <p className="text-lg font-extrabold text-navy leading-none">{last?.arrival_iata}</p>
          <p className="text-xs text-gray">{last ? formatTime(last.arrival_at) : '—'}</p>
          <p className="text-xs text-gray">{last ? formatShortDate(last.arrival_at) : ''}</p>
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <p className="text-xl font-extrabold text-ocean">{offer.price}</p>
          <p className="text-xs text-gray">{offer.currency}</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => last && onPlanTrip(last.arrival_iata)}
          className="px-3 py-1.5 rounded-full bg-ocean text-white text-xs font-bold
                     shadow-sm shadow-ocean/25 hover:bg-ocean-dark transition-colors cursor-pointer"
        >
          Plan trip
        </motion.button>
      </div>
    </motion.div>
  );
};

// Inspiration card
const InspirationCard = ({
  item,
  onPlanTrip,
}: {
  item: FlightInspiration;
  onPlanTrip: (dest: string) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3"
  >
    <div>
      <p className="text-xl font-extrabold text-navy font-mono">{item.destination}</p>
      <p className="text-xs text-gray mt-0.5">Departs {item.departure_date}</p>
      {item.return_date && (
        <p className="text-xs text-gray">Returns {item.return_date}</p>
      )}
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <p className="text-xl font-extrabold text-ocean">{item.price} <span className="text-xs font-normal text-gray">USD</span></p>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onPlanTrip(item.destination)}
        className="px-3 py-1.5 rounded-full bg-ocean text-white text-xs font-bold
                   shadow-sm shadow-ocean/25 hover:bg-ocean-dark transition-colors cursor-pointer"
      >
        Plan trip
      </motion.button>
    </div>
  </motion.div>
);

// ── Main component ─────────────────────────────────────────────────────────────

export const FlightSearch = ({ token, onPlanTrip }: FlightSearchProps) => {
  const [tab, setTab] = useState<Tab>('search');

  // Search-tab form state
  const [origin,      setOrigin]      = useState('');
  const [destination, setDestination] = useState('');
  const [date,        setDate]        = useState('');
  const [adults,      setAdults]      = useState(1);

  // Inspire-tab form state
  const [inspOrigin,   setInspOrigin]   = useState('');
  const [maxPrice,     setMaxPrice]     = useState('');

  // Results
  const [flightOffers,   setFlightOffers]   = useState<FlightOffer[] | null>(null);
  const [inspirations,   setInspirations]   = useState<FlightInspiration[] | null>(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const reset = () => {
    setFlightOffers(null);
    setInspirations(null);
    setError(null);
  };

  const handleSearchFlights = async () => {
    if (!origin || !destination || !date) return;
    reset();
    setLoading(true);
    try {
      const res = await searchFlights(token, origin, destination, date, adults);
      setFlightOffers(res.offers);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetInspirations = async () => {
    if (!inspOrigin) return;
    reset();
    setLoading(true);
    try {
      const res = await getInspirations(token, inspOrigin, maxPrice ? Number(maxPrice) : undefined);
      setInspirations(res.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch inspirations.');
    } finally {
      setLoading(false);
    }
  };

  const hasResults = (flightOffers !== null && flightOffers.length > 0)
    || (inspirations !== null && inspirations.length > 0);
  const isEmpty    = (flightOffers !== null && flightOffers.length === 0)
    || (inspirations !== null && inspirations.length === 0);

  const tabCls = (t: Tab) =>
    t === tab
      ? 'px-4 py-1.5 rounded-full text-sm font-bold bg-ocean text-white shadow-sm cursor-pointer'
      : 'px-4 py-1.5 rounded-full text-sm font-semibold text-gray-500 hover:text-navy cursor-pointer transition-colors';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-extrabold text-navy">Flight Search</h3>
        <TestEnvBadge />
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex gap-1 bg-silver rounded-full p-1 w-fit">
        <button onClick={() => { setTab('search'); reset(); }} className={tabCls('search')}>
          Search Flights
        </button>
        <button onClick={() => { setTab('inspire'); reset(); }} className={tabCls('inspire')}>
          Get Inspired
        </button>
      </div>

      {/* ── Forms ── */}
      <AnimatePresence mode="wait">
        {tab === 'search' ? (
          <motion.div
            key="search-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-end"
          >
            <IataInput id="fs-origin" label="From" value={origin} onChange={setOrigin} placeholder="e.g. LHR" />
            <IataInput id="fs-dest"   label="To"   value={destination} onChange={setDestination} placeholder="e.g. JFK" />

            <div className="flex flex-col gap-1">
              <label htmlFor="fs-date" className="text-xs font-bold text-navy uppercase tracking-wide">
                Date
              </label>
              <input
                id="fs-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-navy
                           focus:outline-none focus:ring-2 focus:ring-ocean/35 focus:border-ocean transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="fs-adults" className="text-xs font-bold text-navy uppercase tracking-wide">
                Adults
              </label>
              <div className="flex gap-2 items-center">
                <input
                  id="fs-adults"
                  type="number"
                  min={1}
                  max={9}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-20 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-navy
                             focus:outline-none focus:ring-2 focus:ring-ocean/35 focus:border-ocean transition-all"
                />
                <motion.button
                  onClick={handleSearchFlights}
                  disabled={loading || !origin || !destination || !date}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 px-4 py-2 rounded-xl bg-ocean text-white text-sm font-bold
                             shadow-sm shadow-ocean/25 hover:bg-ocean-dark disabled:opacity-40
                             disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  {loading ? '…' : 'Search'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="inspire-form"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-wrap gap-3 items-end"
          >
            <IataInput id="insp-origin" label="Flying from" value={inspOrigin} onChange={setInspOrigin} placeholder="e.g. MAD" />

            <div className="flex flex-col gap-1">
              <label htmlFor="insp-price" className="text-xs font-bold text-navy uppercase tracking-wide">
                Max price (USD)
              </label>
              <input
                id="insp-price"
                type="number"
                min={1}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="Optional"
                className="w-32 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-navy
                           focus:outline-none focus:ring-2 focus:ring-ocean/35 focus:border-ocean transition-all"
              />
            </div>

            <motion.button
              onClick={handleGetInspirations}
              disabled={loading || !inspOrigin}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-5 py-2 rounded-xl bg-coral text-white text-sm font-bold
                         shadow-sm shadow-coral/25 hover:bg-coral/90 disabled:opacity-40
                         disabled:cursor-not-allowed transition-all cursor-pointer self-end"
            >
              {loading ? '…' : 'Inspire me'}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Results / States ── */}
      {error && (
        <div className="rounded-xl bg-coral/10 border border-coral/20 px-4 py-3 text-sm text-coral font-medium">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <div className="w-8 h-8 rounded-full border-2 border-ocean border-t-transparent animate-spin" />
        </div>
      )}

      {isEmpty && !loading && (
        <p className="text-sm text-gray text-center py-4">No results found. Try different search parameters.</p>
      )}

      {hasResults && !loading && (
        <div className="space-y-2">
          <p className="text-xs text-gray font-medium">
            {flightOffers ? `${flightOffers.length} offer${flightOffers.length !== 1 ? 's' : ''}` : `${inspirations?.length} destination${(inspirations?.length ?? 0) !== 1 ? 's' : ''}`}
            &nbsp;·&nbsp;
            <span className="text-sunny-dark font-bold">Test data — not real availability</span>
          </p>

          <AnimatePresence>
            {flightOffers?.map((offer) => (
              <FlightOfferCard key={offer.id} offer={offer} onPlanTrip={onPlanTrip} />
            ))}
            {inspirations?.map((item, i) => (
              <InspirationCard key={i} item={item} onPlanTrip={onPlanTrip} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
