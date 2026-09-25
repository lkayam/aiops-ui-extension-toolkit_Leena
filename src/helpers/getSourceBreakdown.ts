/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERT_QUERY_PARAMS } from '../components/constants';

export interface BreakdownEntry {
  group: string;
  value: number;
}

export interface SourceBreakdown {
  bySender: BreakdownEntry[];
  byType: BreakdownEntry[];
}

const COL = ALERT_QUERY_PARAMS.columns;

/**
 * Groups alert rows by sender.name and type.classification, returning sorted
 * { group, value }[] arrays suitable for Carbon PieChart data props.
 * @param rows - alert rows from getAlerts response (data.tenant.alerts.rows)
 */
export default function getSourceBreakdown(
  rows: Array<{ fields: (string | null)[] }>
): SourceBreakdown {
  const senderIdx = COL.indexOf('sender.name');
  const typeIdx = COL.indexOf('type.classification');

  const senderMap: { [key: string]: number } = {};
  const typeMap: { [key: string]: number } = {};

  (rows || []).forEach(row => {
    const fields = row.fields;

    const sender = fields[senderIdx] || 'Unknown';
    senderMap[sender] = (senderMap[sender] || 0) + 1;

    const type = fields[typeIdx] || 'Unknown';
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  const toSorted = (map: { [key: string]: number }): BreakdownEntry[] =>
    Object.entries(map)
      .map(([group, value]) => ({ group, value }))
      .sort((a, b) => b.value - a.value);

  return {
    bySender: toSorted(senderMap),
    byType: toSorted(typeMap),
  };
}
