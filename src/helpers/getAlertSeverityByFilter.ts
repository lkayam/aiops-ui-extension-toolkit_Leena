/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { SEVERITIES } from '../components/constants';

export interface FilterSeverityRow {
  /**
   * Severity label e.g. "Critical" — drives the Carbon chart colour series
   * (the `group` field is what Carbon GroupedBarChart uses for series/legend).
   */
  group: string;
  /** Filter name — mapped to the bottom axis (`mapsTo: 'filterName'`) */
  filterName: string;
  value: number;
}

export interface FilterSummaryEntry {
  filterName: string;
  summary: Array<{ severity: number; count: number }>;
}

/**
 * Converts per-filter alertSummary results into a flat array of
 * { group, filterName, value } rows for a Carbon GroupedBarChart, where each
 * severity becomes a colour series and each filter is an x-axis category.
 *
 * Only non-zero severity counts are emitted so the chart stays clean.
 *
 * @param filterSummaries  One entry per AIOps filter with its alertSummary rows
 */
export default function getAlertSeverityByFilter(
  filterSummaries: FilterSummaryEntry[]
): FilterSeverityRow[] {
  const rows: FilterSeverityRow[] = [];

  (filterSummaries || []).forEach(({ filterName, summary }) => {
    (summary || []).forEach(({ severity, count }) => {
      if (count <= 0) return;
      rows.push({
        group: SEVERITIES[severity] ?? `Severity ${severity}`,
        filterName,
        value: count,
      });
    });
  });

  return rows;
}
