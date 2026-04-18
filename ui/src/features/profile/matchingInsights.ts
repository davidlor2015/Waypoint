import type { MatchResult, TravelProfile } from '../../shared/api/matching';

interface CompletenessCheck {
  done: boolean;
  label: string;
}

export interface ProfileCompleteness {
  score: number;
  completed: number;
  total: number;
  checks: CompletenessCheck[];
  prompts: string[];
}

export interface MatchInsight {
  title: string;
  body: string;
}

export interface MatchNarrative {
  strengths: MatchInsight[];
  frictions: MatchInsight[];
}

function pct(value: number): number {
  return Math.round(value * 100);
}

export function formatMatchingLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getProfileCompleteness(profile: TravelProfile): ProfileCompleteness {
  const checks: CompletenessCheck[] = [
    { done: Boolean(profile.travel_style), label: 'Travel style selected' },
    { done: Boolean(profile.budget_range), label: 'Budget range selected' },
    { done: profile.interests.length >= 3, label: 'At least 3 interests added' },
    { done: profile.group_size_min >= 1, label: 'Minimum group size set' },
    { done: profile.group_size_max >= profile.group_size_min, label: 'Valid group size range' },
    { done: profile.is_discoverable, label: 'Discoverable for matching' },
  ];

  const completed = checks.filter((check) => check.done).length;
  const prompts: string[] = [];

  if (profile.interests.length < 3) {
    prompts.push(`Add ${3 - profile.interests.length} more interest${profile.interests.length === 2 ? '' : 's'} so we can explain overlap more clearly.`);
  }
  if (!profile.is_discoverable) {
    prompts.push('Turn discoverability on so other travellers can actually find your trips.');
  }
  if (profile.group_size_max - profile.group_size_min < 1) {
    prompts.push('Widen your preferred group size a little to surface more compatible travellers.');
  }

  return {
    score: Math.round((completed / checks.length) * 100),
    completed,
    total: checks.length,
    checks,
    prompts,
  };
}

export function buildMatchNarrative(result: MatchResult): MatchNarrative {
  const strengths: MatchInsight[] = [];
  const frictions: MatchInsight[] = [];

  if (result.breakdown.interests >= 0.7) {
    strengths.push({
      title: 'Shared interests',
      body: `Strong activity overlap at ${pct(result.breakdown.interests)}%, which usually makes planning much easier.`,
    });
  }
  if (result.breakdown.travel_style >= 0.7) {
    strengths.push({
      title: 'Similar pace',
      body: `Your travel styles are closely aligned at ${pct(result.breakdown.travel_style)}%.`,
    });
  }
  if (result.breakdown.budget >= 0.7) {
    strengths.push({
      title: 'Budget fit',
      body: `Spending expectations line up well at ${pct(result.breakdown.budget)}%.`,
    });
  }
  if (result.breakdown.group_size >= 0.7) {
    strengths.push({
      title: 'Group size fit',
      body: `You want a similar trip size, scoring ${pct(result.breakdown.group_size)}%.`,
    });
  }
  if (result.breakdown.date_overlap >= 0.7) {
    strengths.push({
      title: 'Timing overlap',
      body: `Trip timing aligns strongly at ${pct(result.breakdown.date_overlap)}%, so coordinating should be easier.`,
    });
  }
  if (result.breakdown.destination >= 0.7) {
    strengths.push({
      title: 'Destination alignment',
      body: `You are pointed at a very similar destination fit, scoring ${pct(result.breakdown.destination)}%.`,
    });
  }

  if (result.breakdown.date_overlap < 0.45) {
    frictions.push({
      title: 'Schedule mismatch',
      body: `Date overlap is only ${pct(result.breakdown.date_overlap)}%, so timing may need flexibility.`,
    });
  }
  if (result.breakdown.budget < 0.45) {
    frictions.push({
      title: 'Budget mismatch',
      body: `Budget alignment is ${pct(result.breakdown.budget)}%, which could affect accommodation or activity choices.`,
    });
  }
  if (result.breakdown.travel_style < 0.45) {
    frictions.push({
      title: 'Different travel pace',
      body: `Travel style alignment is ${pct(result.breakdown.travel_style)}%, so expectations may need discussion early.`,
    });
  }
  if (result.breakdown.group_size < 0.45) {
    frictions.push({
      title: 'Group size mismatch',
      body: `Preferred group size only scores ${pct(result.breakdown.group_size)}%, which may change the trip dynamic.`,
    });
  }

  if (strengths.length === 0) {
    strengths.push({
      title: 'Balanced fit',
      body: `This match is driven by several moderate signals rather than one standout area.`,
    });
  }

  return {
    strengths: strengths.slice(0, 3),
    frictions: frictions.slice(0, 2),
  };
}
