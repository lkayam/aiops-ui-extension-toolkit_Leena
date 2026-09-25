/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEVERITIES } from '../components/constants';

export interface SeverityCount {
  group: string;
  value: number;
  /** 0-based severity index matching COLORS / SEVERITIES */
  severityIndex: number;
}

/**
 * Converts an alertSummary response (grouped by severity) into a sorted array
 * of { group, value } objects suitable for Carbon SimpleBarChart data.
 * Zero-count severities are excluded so the chart stays clean.
 *
 * @param summaryEntries  Array of { severity, count } from getAlertSummary response
 */
export default function getAlertSeverityCounts(
  summaryEntries: Array<{ severity: number; count: number }>
): SeverityCount[] {
  return (summaryEntries || [])
    .filter(e => e.count > 0)
    .map(e => ({
      group: SEVERITIES[e.severity] ?? `Severity ${e.severity}`,
      value: e.count,
      severityIndex: e.severity,
    }))
    .sort((a, b) => b.severityIndex - a.severityIndex);
}
