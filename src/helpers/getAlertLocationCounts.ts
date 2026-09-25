/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERT_QUERY_PARAMS } from '../components/constants';

export interface LocationCount {
  group: string;
  value: number;
}

const COL = ALERT_QUERY_PARAMS.columns;

/**
 * Groups alert rows by resource.name, returning the top-n locations sorted
 * by alert count descending in a { group, value }[] format suitable for
 * Carbon SimpleBarChart data.
 *
 * @param rows  Alert rows from getAlerts response (data.tenant.alerts.rows)
 * @param n     Maximum number of locations to return (default 15)
 */
export default function getAlertLocationCounts(
  rows: Array<{ fields: (string | null)[] }>,
  n = 15
): LocationCount[] {
  const resourceIdx = COL.indexOf('resource.name');

  const locationMap: { [key: string]: number } = {};

  (rows || []).forEach(row => {
    const resource = row.fields[resourceIdx] || 'Unknown';
    locationMap[resource] = (locationMap[resource] || 0) + 1;
  });

  return Object.entries(locationMap)
    .map(([group, value]) => ({ group, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}
