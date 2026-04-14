import { motion } from 'framer-motion';



interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const PlaneIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11h2v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 20 20" className="w-6 h-6" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
  </svg>
);

const ClipboardIcon = () => (
  <svg viewBox="0 0 20 20" className="w-6 h-6" fill="currentColor" aria-hidden="true">
    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 20 20" className="w-6 h-6" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.22, duration: 0.55 } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const FEATURES = [
  {
    icon:        <SparkleIcon />,
    iconBg:      'bg-clay/10 text-clay',
    title:       'Itinerary Generation',
    description:
      'Stream a day-by-day plan live or use the smart rule-based engine powered by real POI data. Preview before you save anything.',
  },
  {
    icon:        <ClipboardIcon />,
    iconBg:      'bg-amber/15 text-amber',
    title:       'Packing Lists & Budgets',
    description:
      'Every trip gets its own checklist and expense tracker. Set a spending limit, log costs by category, and track progress with a live progress bar.',
  },
  {
    icon:        <GlobeIcon />,
    iconBg:      'bg-espresso/10 text-espresso',
    title:       'Explore & Flight Search',
    description:
      'Browse curated destinations enriched with live Teleport quality scores, then search flight offers and get destination inspiration via the Amadeus API.',
  },
];


const STEPS = [
  {
    number: '01',
    title:  'Create a trip',
    body:   'Add your destination and travel dates. Notes and interests feed directly into the planner.',
  },
  {
    number: '02',
    title:  'Generate an itinerary',
    body:   'Pick streaming output or Smart Plan for a structured itinerary built from real-world data.',
  },
  {
    number: '03',
    title:  'Pack and track',
    body:   'Build your packing checklist, log every expense, and head to the airport knowing nothing is forgotten.',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const FeatureCard = ({
  icon, iconBg, title, description,
}: typeof FEATURES[number]) => (
  <motion.div
    variants={fadeUp}
    className="bg-white rounded-2xl border border-smoke/60 shadow-sm p-6 flex flex-col gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-espresso leading-snug">{title}</h3>
      <p className="text-sm text-flint mt-1.5 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

const Step = ({ number, title, body, last }: typeof STEPS[number] & { last: boolean }) => (
  <div className="flex gap-5 items-start">
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-10 h-10 rounded-full bg-espresso text-ivory text-sm font-extrabold flex items-center justify-center shadow-sm shadow-espresso/25">
        {number}
      </div>
      {!last && <div className="w-px flex-1 bg-smoke mt-2 min-h-[32px]" />}
    </div>
    <div className="pb-8">
      <p className="font-bold text-espresso leading-snug">{title}</p>
      <p className="text-sm text-flint mt-1 leading-relaxed">{body}</p>
    </div>
  </div>
);

// ── Main component ────────────────────────────────────────────────────────────

export const LandingPage = ({ onGetStarted, onSignIn }: LandingPageProps) => (
  <div className="min-h-screen bg-ivory font-sans overflow-x-hidden">

    {/* ── Navbar ── */}
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-smoke/60">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 select-none">
          <PlaneIcon />
          <span className="text-base font-bold text-espresso tracking-tight font-display">
            Travel<span className="text-clay">Planner</span>
          </span>
        </div>
        <button
          onClick={onSignIn}
          className="px-4 py-1.5 rounded-full text-sm font-semibold text-espresso hover:bg-parchment transition-colors cursor-pointer"
        >
          Sign in
        </button>
      </div>
    </header>

    {/* ── Hero ── */}
    <section className="relative overflow-hidden px-6 pt-24 pb-28 flex items-center justify-center text-center">

      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-20 w-[480px] h-[480px] rounded-full bg-clay/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-12 w-[400px] h-[400px] rounded-full bg-clay/8 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 right-1/3 w-[260px] h-[260px] rounded-full bg-amber/10 blur-2xl" />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative max-w-2xl mx-auto space-y-6"
      >
        {/* Eyebrow pill */}
     

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          className="text-4xl sm:text-5xl font-bold text-espresso leading-tight tracking-tight"
        >
          Plan your next<br />
          <span className="text-clay">adventure.</span>
        </motion.h1>

        {/* Body */}
        <motion.p variants={fadeUp} className="text-base text-flint leading-relaxed max-w-lg mx-auto">
          Generate day-by-day itineraries, manage packing lists and budgets per trip,
          and discover your next destination — all in one place.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber text-white
                       text-sm font-bold shadow-lg shadow-amber/25 hover:bg-amber-dark
                       transition-colors cursor-pointer"
          >
            Get started free <ArrowRightIcon />
          </motion.button>
          <motion.button
            onClick={onSignIn}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-espresso
                       text-sm font-bold border border-smoke hover:bg-parchment
                       transition-colors cursor-pointer"
          >
            Sign in
          </motion.button>
        </motion.div>

        {/* Social proof row */}
        <motion.p variants={fadeUp} className="text-xs text-flint pt-1">
          Free to use &nbsp;·&nbsp; No credit card required &nbsp;·&nbsp; Your data stays private
        </motion.p>
      </motion.div>
    </section>

    {/* ── Features ── */}
    <section className="px-6 py-20 bg-parchment/60">
      <div className="max-w-5xl mx-auto">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.p variants={fadeUp} className="text-xs font-bold text-amber uppercase tracking-widest text-center mb-2">
            Features
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-2xl font-bold text-espresso text-center mb-10">
            Everything you need for a great trip
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </motion.div>
      </div>
    </section>

    {/* ── How it works ── */}
    <section className="px-6 py-20">
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-12 items-start">

        {/* Left — heading */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        >
          <p className="text-xs font-bold text-amber uppercase tracking-widest mb-2">How it works</p>
          <h2 className="text-2xl font-bold text-espresso leading-snug">
            From idea to itinerary<br />in three steps
          </h2>
          <p className="text-sm text-flint mt-3 leading-relaxed">
            No complex setup. Create a trip, let the planner do the heavy lifting,
            then use the built-in tools to stay organised.
          </p>
        </motion.div>

        {/* Right — steps */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          {STEPS.map((step, i) => (
            <motion.div key={step.number} variants={fadeUp}>
              <Step {...step} last={i === STEPS.length - 1} />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>

    {/* ── CTA strip ── */}
    <section className="px-6 py-16 bg-espresso">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.55 }}
        className="max-w-2xl mx-auto text-center space-y-5"
      >
        <h2 className="text-2xl font-bold text-ivory">
          Ready to start planning?
        </h2>
        <p className="text-sm text-ivory/70 leading-relaxed">
          Create your free account and generate your first itinerary in under a minute.
        </p>
        <motion.button
          onClick={onGetStarted}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-ivory text-espresso
                     text-sm font-bold shadow-lg hover:bg-parchment transition-colors cursor-pointer"
        >
          Get started free <ArrowRightIcon />
        </motion.button>
      </motion.div>
    </section>

    {/* ── Footer ── */}
    <footer className="px-6 py-6 border-t border-smoke/50">
      <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 select-none">
          <PlaneIcon />
          <span className="text-sm font-bold text-espresso font-display">
            Travel<span className="text-clay">Planner</span>
          </span>
        </div>
        <p className="text-xs text-flint">
          Portfolio project &nbsp;·&nbsp; Built with FastAPI, React, and Ollama
        </p>
      </div>
    </footer>

  </div>
);
