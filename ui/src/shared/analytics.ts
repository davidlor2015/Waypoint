export type AnalyticsEvent = {
  name: string;
  props?: Record<string, string | number | boolean | null | undefined>;
};

export function track(event: AnalyticsEvent): void {
  if (import.meta.env.DEV) {
    // Lightweight local instrumentation for now; can be swapped with Segment/PostHog later.
    console.info('[analytics]', event.name, event.props ?? {});
  }
}
