import { useState, useRef, useCallback, useEffect } from 'react';
import { API_URL } from '../../app/config';
import type { Itinerary } from '../api/ai';



export interface StreamState {
  text: string;
  itinerary: Itinerary | null;
  error: string | null;
  streaming: boolean;
}

interface SSEMessage {
  event: string;
  data: string;
}



/**
 * Reads raw bytes from a fetch ReadableStream and yields parsed SSE messages.
 * Handles chunked delivery — a single read() call may contain partial or
 * multiple messages; the buffer ensures correct assembly.
 */
async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<SSEMessage> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE messages are separated by blank lines (\n\n)
    const messages = buffer.split('\n\n');
    buffer = messages.pop() ?? ''; // keep any incomplete trailing message

    for (const message of messages) {
      if (!message.trim()) continue;
      let event = 'message';
      let data = '';
      for (const line of message.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data = line.slice(5).trim();
      }
      if (data) yield { event, data };
    }
  }
}



/**
 * Manages SSE-based itinerary streaming for multiple trips simultaneously.
 *
 * - `start(tripId)` opens a fetch stream to GET /v1/ai/stream/{tripId}
 *   and updates state as token / complete / error events arrive.
 * - `reset(tripId)` cancels any in-flight request and clears state for that trip.
 * - All in-flight streams are aborted automatically on unmount.
 */
export function useStreamingItinerary(token: string): {
  streams: Record<number, StreamState>;
  start: (tripId: number, interestsOverride?: string) => void;
  reset: (tripId: number) => void;
} {
  const [streams, setStreams] = useState<Record<number, StreamState>>({});
  const controllers = useRef<Record<number, AbortController>>({});

  const start = useCallback(
    (tripId: number, interestsOverride?: string) => {
      controllers.current[tripId]?.abort();
      const controller = new AbortController();
      controllers.current[tripId] = controller;

      setStreams((prev) => ({
        ...prev,
        [tripId]: { text: '', itinerary: null, error: null, streaming: true },
      }));

      (async () => {
        try {
          const params = new URLSearchParams();
          if (interestsOverride) params.set('interests_override', interestsOverride);
          const query = params.size > 0 ? `?${params.toString()}` : '';

          const response = await fetch(`${API_URL}/v1/ai/stream/${tripId}${query}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            throw new Error(`Stream request failed (${response.status})`);
          }

          const reader = response.body.getReader();

          for await (const { event, data } of parseSSE(reader)) {
            if (controller.signal.aborted) break;

            if (event === 'token') {
              const parsed = JSON.parse(data) as { token: string };
              setStreams((prev) => ({
                ...prev,
                [tripId]: {
                  ...prev[tripId],
                  text: (prev[tripId]?.text ?? '') + parsed.token,
                },
              }));
            } else if (event === 'complete') {
              const itinerary = JSON.parse(data) as Itinerary;
              setStreams((prev) => ({
                ...prev,
                [tripId]: { ...prev[tripId], itinerary, streaming: false },
              }));
            } else if (event === 'error') {
              const { message } = JSON.parse(data) as { message: string };
              setStreams((prev) => ({
                ...prev,
                [tripId]: { ...prev[tripId], error: message, streaming: false },
              }));
            }
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            const message = err instanceof Error ? err.message : 'Streaming failed.';
            setStreams((prev) => ({
              ...prev,
              [tripId]: { ...prev[tripId], error: message, streaming: false },
            }));
          }
        } finally {
          delete controllers.current[tripId];
        }
      })();
    },
    [token],
  );

  const reset = useCallback((tripId: number) => {
    controllers.current[tripId]?.abort();
    setStreams((prev) => {
      const next = { ...prev };
      delete next[tripId];
      return next;
    });
  }, []);

  useEffect(
    () => () => {
      Object.values(controllers.current).forEach((c) => c.abort());
    },
    [],
  );

  return { streams, start, reset };
}
