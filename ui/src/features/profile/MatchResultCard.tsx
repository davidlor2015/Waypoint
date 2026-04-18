import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  updateMatchInteraction,
  type MatchInteractionStatus,
  type MatchResult,
} from '../../shared/api/matching';
import { ScoreBar } from './ScoreBar';
import { buildMatchNarrative } from './matchingInsights';

function displayName(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}


interface MatchResultCardProps {
  token: string;
  requestId: number;
  result: MatchResult;
}

function workflowLabel(state: MatchInteractionStatus | 'none'): string {
  if (state === 'interested') return 'Interested';
  if (state === 'intro_saved') return 'Intro Saved';
  if (state === 'passed') return 'Passed';
  if (state === 'accepted') return 'Accepted';
  if (state === 'declined') return 'Declined';
  return 'No action yet';
}

export const MatchResultCard = ({ token, requestId, result }: MatchResultCardProps) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [interaction, setInteraction] = useState(result.interaction);
  const [draftIntro, setDraftIntro] = useState(() =>
    result.interaction?.note || `Hey ${displayName(result.matched_user.email)}, we look like a strong fit for ${result.matched_trip.destination}. Want to compare plans?`,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const narrative = buildMatchNarrative(result);

  const updateWorkflow = async (state: MatchInteractionStatus) => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await updateMatchInteraction(token, requestId, result.id, {
        status: state,
        note: draftIntro,
      });
      setInteraction(updated.interaction);
      if (updated.interaction?.note) {
        setDraftIntro(updated.interaction.note);
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update match workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 12 },
        show: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring' as const, bounce: 0.2, duration: 0.38 },
        },
      }}
      className="rounded-2xl border border-smoke/60 bg-white p-4 shadow-sm space-y-4"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-base font-bold text-espresso">{displayName(result.matched_user.email)}</p>
          <p className="text-xs text-flint/70 mt-0.5">{result.matched_user.email}</p>
          <p className="text-sm text-flint mt-1">{result.matched_trip.destination}</p>
          <p className="text-xs text-flint/80 mt-1">
            {result.matched_trip.start_date} to {result.matched_trip.end_date}
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-full bg-olive/10 border border-olive/20 text-olive text-sm font-bold">
          {Math.round(result.score * 100)}% match
        </span>
      </div>

      <ScoreBar label="Overall Compatibility" value={result.score} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-olive/20 bg-olive/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-olive">Why this match works</p>
          <div className="mt-2 space-y-2">
            {narrative.strengths.map((item) => (
              <div key={item.title}>
                <p className="text-sm font-semibold text-espresso">{item.title}</p>
                <p className="text-xs text-flint mt-0.5">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-smoke bg-parchment/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-flint">Things to confirm</p>
          <div className="mt-2 space-y-2">
            {narrative.frictions.length > 0 ? (
              narrative.frictions.map((item) => (
                <div key={item.title}>
                  <p className="text-sm font-semibold text-espresso">{item.title}</p>
                  <p className="text-xs text-flint mt-0.5">{item.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-flint">No obvious friction points stand out. A short intro should be enough to validate the fit.</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-smoke/60 bg-parchment/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-bold text-espresso">Request workflow</p>
            <p className="text-xs text-flint mt-0.5">Track your next step and keep an intro message ready.</p>
          </div>
          <span className="px-3 py-1.5 rounded-full border border-smoke bg-white text-xs font-bold text-flint">
            {workflowLabel(interaction?.status ?? 'none')}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => void updateWorkflow('interested')}
            disabled={saving}
            className="px-3 py-2 rounded-full bg-amber text-white text-sm font-semibold hover:bg-amber-dark transition-colors disabled:opacity-50"
          >
            Mark Interested
          </button>
          <button
            type="button"
            onClick={() => void updateWorkflow('intro_saved')}
            disabled={saving}
            className="px-3 py-2 rounded-full bg-clay text-white text-sm font-semibold hover:bg-clay-dark transition-colors disabled:opacity-50"
          >
            Save Intro Draft
          </button>
          <button
            type="button"
            onClick={() => void updateWorkflow('passed')}
            disabled={saving}
            className="px-3 py-2 rounded-full border border-smoke bg-white text-sm font-semibold text-flint hover:bg-smoke transition-colors disabled:opacity-50"
          >
            Pass
          </button>
        </div>

        {saveError ? (
          <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium">
            {saveError}
          </div>
        ) : null}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-flint mb-2">
            Intro draft
          </label>
          <textarea
            value={draftIntro}
            onChange={(e) => {
              const next = e.target.value;
              setDraftIntro(next);
            }}
            rows={3}
            className="w-full rounded-2xl border border-smoke bg-white px-4 py-3 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-amber/40 focus:border-amber transition-all"
          />
        </div>
      </div>

      <motion.button
        type="button"
        onClick={() => setShowBreakdown((value) => !value)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-2.5 rounded-full bg-parchment text-espresso text-sm font-semibold
                   hover:bg-smoke transition-colors duration-150 cursor-pointer"
      >
        {showBreakdown ? 'Hide Breakdown' : 'View Breakdown'}
      </motion.button>

      <AnimatePresence initial={false}>
        {showBreakdown ? (
          <motion.div
            key="breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <ScoreBar label="Destination" value={result.breakdown.destination} />
              <ScoreBar label="Date Overlap" value={result.breakdown.date_overlap} />
              <ScoreBar label="Travel Style" value={result.breakdown.travel_style} />
              <ScoreBar label="Budget" value={result.breakdown.budget} />
              <ScoreBar label="Interests" value={result.breakdown.interests} />
              <ScoreBar label="Group Size" value={result.breakdown.group_size} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
};
