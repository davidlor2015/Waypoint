import { useState } from 'react';
import { motion } from 'framer-motion';

import { TravelProfileForm } from './TravelProfileForm';
import { MatchRequestList } from './MatchRequestList';
import { useMatchingProfile } from './useMatchingProfile';
import { useMatchRequests } from './useMatchRequests';
import type { Trip } from '../../shared/api/trips';
import { formatMatchingLabel, getProfileCompleteness } from './matchingInsights';


interface MatchingPageProps {
  token: string;
  trips: Trip[];
}

export const MatchingPage = ({ token, trips }: MatchingPageProps) => {
  const { profile, loading, error, upsert } = useMatchingProfile(token);
  const { requests, loading: requestsLoading } = useMatchRequests(token);
  const [editing, setEditing] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[320px] flex items-center justify-center rounded-2xl border border-smoke/60 bg-white text-sm font-medium text-flint">
        Loading matching profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-espresso">Find compatible travellers</h2>
          <p className="text-sm text-flint mt-1">
            Set up your matching profile first so we can compare travel style, budget, interests, and group size.
          </p>
        </div>

        {error ? (
          <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium">
            {error}
          </div>
        ) : null}

        <TravelProfileForm token={token} onSubmitProfile={upsert} />
      </div>
    );
  }

  const completeness = getProfileCompleteness(profile);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-espresso">Matching</h2>
          <p className="text-sm text-flint mt-1">
            Your profile is ready. Open a trip request to start seeing compatible travellers.
          </p>
        </div>

        <motion.button
          type="button"
          onClick={() => setEditing((value) => !value)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-full bg-amber text-white text-sm font-bold shadow-sm shadow-amber/25
                     hover:bg-amber-dark transition-colors duration-150 cursor-pointer"
        >
          {editing ? 'Close Editor' : 'Edit Profile'}
        </motion.button>
      </div>

      {error ? (
        <div className="px-4 py-3 rounded-xl bg-danger/10 border border-danger/25 text-danger text-sm font-medium">
          {error}
        </div>
      ) : null}

      {editing ? (
        <TravelProfileForm
          token={token}
          profile={profile}
          onSubmitProfile={upsert}
          onSuccess={() => setEditing(false)}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0.22, duration: 0.42 }}
          className="bg-white rounded-2xl border border-smoke/60 shadow-sm p-6 space-y-5"
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-lg font-bold text-espresso">Your matching profile</h3>
              <p className="text-sm text-flint mt-1">
                These preferences are used to score and rank potential travel matches.
              </p>
            </div>

            <span
              className={[
                'px-3 py-1.5 rounded-full border text-xs font-bold',
                profile.is_discoverable
                  ? 'bg-olive/10 text-olive border-olive/20'
                  : 'bg-parchment text-flint border-smoke',
              ].join(' ')}
            >
              {profile.is_discoverable ? 'Discoverable' : 'Hidden'}
            </span>
          </div>

          <div className="rounded-2xl border border-smoke bg-parchment/70 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-flint">Profile quality</p>
                <p className="text-base font-bold text-espresso mt-1">{completeness.score}% complete</p>
              </div>
              <span className="px-3 py-1.5 rounded-full bg-white border border-smoke text-xs font-bold text-flint">
                {completeness.completed}/{completeness.total} signals ready
              </span>
            </div>

            <div className="h-2 rounded-full bg-white border border-smoke overflow-hidden">
              <div className="h-full rounded-full bg-amber" style={{ width: `${completeness.score}%` }} />
            </div>

            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              {completeness.checks.map((check) => (
                <div
                  key={check.label}
                  className={[
                    'rounded-xl border px-3 py-2',
                    check.done
                      ? 'bg-olive/10 border-olive/20 text-olive'
                      : 'bg-white border-smoke text-flint',
                  ].join(' ')}
                >
                  {check.label}
                </div>
              ))}
            </div>

            {completeness.prompts.length > 0 && (
              <div className="rounded-xl bg-white border border-smoke px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-flint">Improve your match quality</p>
                <div className="mt-2 space-y-2 text-sm text-flint">
                  {completeness.prompts.map((prompt) => (
                    <p key={prompt}>{prompt}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-parchment border border-smoke px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-flint">Travel style</p>
              <p className="text-base font-bold text-espresso mt-1">{formatMatchingLabel(profile.travel_style)}</p>
            </div>

            <div className="rounded-2xl bg-parchment border border-smoke px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-flint">Budget</p>
              <p className="text-base font-bold text-espresso mt-1">{formatMatchingLabel(profile.budget_range)}</p>
            </div>

            <div className="rounded-2xl bg-parchment border border-smoke px-4 py-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-flint">Interests</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="px-3 py-1.5 rounded-full bg-amber/10 border border-amber/20 text-amber text-sm font-semibold"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-parchment border border-smoke px-4 py-4 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-flint">Preferred group size</p>
              <p className="text-base font-bold text-espresso mt-1">
                {profile.group_size_min} to {profile.group_size_max} travellers
              </p>
            </div>
          </div>

        </motion.div>
      )}

      {!editing && !requestsLoading && (
        <MatchRequestList token={token} trips={trips} requests={requests} />
      )}

      {!editing && requestsLoading && (
        <div className="min-h-[80px] flex items-center justify-center text-sm font-medium text-flint">
          Loading match requests…
        </div>
      )}
    </div>
  );
};
