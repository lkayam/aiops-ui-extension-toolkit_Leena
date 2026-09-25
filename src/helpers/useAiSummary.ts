/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback } from 'react';

export interface AiSummaryOptions {
  /** The URL of the AI summarisation endpoint. When undefined, the hook is a no-op. */
  endpointUrl: string | undefined;
}

export interface AiSummaryInput {
  /** Plain-text context document built by buildAiContext(). */
  contextDocument: string;
}

export interface AiSummaryResult {
  /** The AI-generated summary text, or null when not yet fetched / not configured. */
  summary: string | null;
  loading: boolean;
  error: string | null;
  /** Triggers a (re-)fetch. No-op when endpointUrl is undefined. */
  refresh: () => void;
}

/**
 * Provider-neutral hook for requesting an AI summary of the dashboard context.
 *
 * Phase-1 behaviour: when endpointUrl is undefined the hook is a full no-op —
 * refresh() does nothing, summary stays null, and no network request is made.
 * The component should display an empty-state message in that case.
 *
 * When endpointUrl IS provided the hook POSTs { context: contextDocument } as
 * JSON and expects the response body to be { summary: string }.
 */
export function useAiSummary(
  input: AiSummaryInput,
  options: AiSummaryOptions
): AiSummaryResult {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!options.endpointUrl) {
      // No-op: endpoint not configured
      return;
    }

    setLoading(true);
    setError(null);

    fetch(options.endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: input.contextDocument }),
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((body: { summary?: string }) => {
        setSummary(body.summary ?? '');
      })
      .catch((err: Error) => {
        setError(err.message || 'Unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [options.endpointUrl, input.contextDocument]);

  return { summary, loading, error, refresh };
}
