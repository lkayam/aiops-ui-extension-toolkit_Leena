/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERT_QUERY_PARAMS } from '../components/constants';

export interface TopApplication {
  name: string;
  alertCount: number;
  maxSeverity: number;
}

const COL = ALERT_QUERY_PARAMS.columns;

/**
 * Groups alert rows by topology/group application name, accumulates alert count
 * and maxSeverity per application, returns top n sorted by alertCount descending.
 * Uses the same positional access and JSON parse pattern as getTimeGroupCountsByApp.
 * @param rows - alert rows from getAlerts response (data.tenant.alerts.rows)
 * @param n - maximum number of applications to return (default 10)
 */
export default function getTopApplications(
  rows: Array<{ fields: (string | null)[] }>,
  n = 10
): TopApplication[] {
  const topoGroupIdx = COL.indexOf(
    '@insights.type=\'aiops.ibm.com/insight-type/topology/group\''
  );
  const sevIdx = COL.indexOf('severity');

  const appMap: { [name: string]: TopApplication } = {};

  (rows || []).forEach(row => {
    const fields = row.fields;
    const topoGroupStr = fields[topoGroupIdx];
    const severity = +(fields[sevIdx] || '0');

    let appName = '';
    if (topoGroupStr) {
      try {
        const parsed = JSON.parse(topoGroupStr);
        appName = parsed?.[0]?.details?.name || '';
      } catch {
        // ignore malformed JSON
      }
    }

    if (!appName) return;

    if (!appMap[appName]) {
      appMap[appName] = { name: appName, alertCount: 0, maxSeverity: 0 };
    }
    appMap[appName].alertCount++;
    if (severity > appMap[appName].maxSeverity) {
      appMap[appName].maxSeverity = severity;
    }
  });

  return Object.values(appMap)
    .sort((a, b) => b.alertCount - a.alertCount)
    .slice(0, n);
}
