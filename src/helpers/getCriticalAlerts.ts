/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import { ALERT_QUERY_PARAMS, SEVERITIES } from '../components/constants';

export interface CriticalAlert {
  severity: number;
  severityLabel: string;
  summary: string;
  resourceName: string;
  senderName: string;
  typeClassification: string;
  firstOccurrenceTime: string;
  lastOccurrenceTime: string;
  acknowledged: boolean;
  hasIncident: boolean;
  hasRunbook: boolean;
  hasCausalRelationship: boolean;
  applicationName: string;
}

const COL = ALERT_QUERY_PARAMS.columns;

/**
 * Filters alert rows to severity >= 5 (Major / Critical), excludes suppressed alerts,
 * resolves all fields positionally via ALERT_QUERY_PARAMS.columns, and returns
 * the top 20 sorted by severity descending then firstOccurrenceTime ascending.
 * @param rows - alert rows from getAlerts response (data.tenant.alerts.rows)
 */
export default function getCriticalAlerts(
  rows: Array<{ fields: (string | null)[] }>
): CriticalAlert[] {
  const sevIdx = COL.indexOf('severity');
  const summaryIdx = COL.indexOf('summary');
  const typeIdx = COL.indexOf('type.classification');
  const senderIdx = COL.indexOf('sender.name');
  const resourceIdx = COL.indexOf('resource.name');
  const firstOccIdx = COL.indexOf('firstOccurrenceTime');
  const lastOccIdx = COL.indexOf('lastOccurrenceTime');
  const suppIdx = COL.indexOf('suppressed');
  const runbookIdx = COL.indexOf('@insights.type=\'aiops.ibm.com/insight-type/runbook\'');
  const relatedStoriesIdx = COL.indexOf('relatedStoryIds');
  const relCtxStoriesIdx = COL.indexOf('relatedContextualStoryIds');
  const ackIdx = COL.indexOf('acknowledged');
  const topoGroupIdx = COL.indexOf('@insights.type=\'aiops.ibm.com/insight-type/topology/group\'');
  const causalTopoIdx = COL.indexOf(
    '@insights.type=\'aiops.ibm.com/insight-type/relationship/causal\' and insights.source=\'aiops.ibm.com/insight-source/relationship/causal/topological-group\''
  );
  const causalCustomIdx = COL.indexOf(
    '@insights.type=\'aiops.ibm.com/insight-type/relationship/causal\' and insights.source=\'aiops.ibm.com/insight-source/relationship/causal/custom\''
  );
  const causalTemporalIdx = COL.indexOf(
    '@insights.type=\'aiops.ibm.com/insight-type/relationship/causal\' and insights.source=\'aiops.ibm.com/insight-source/relationship/causal/temporal\''
  );

  const parsed: CriticalAlert[] = [];

  (rows || []).forEach(row => {
    const fields = row.fields;
    const severity = +(fields[sevIdx] || '0');

    if (severity < 5) return;
    if (fields[suppIdx] === 'true') return;

    let hasIncident = false;
    try {
      const related = JSON.parse(fields[relatedStoriesIdx] || '[]') as string[];
      const relCtx = JSON.parse(fields[relCtxStoriesIdx] || '[]') as string[];
      hasIncident = related.length > 0 || relCtx.length > 0;
    } catch {
      // ignore malformed JSON
    }

    const hasRunbook = !!fields[runbookIdx];

    const hasCausalRelationship =
      !!fields[causalTopoIdx] || !!fields[causalCustomIdx] || !!fields[causalTemporalIdx];

    let applicationName = '';
    try {
      const topoGroupStr = fields[topoGroupIdx];
      if (topoGroupStr) {
        const parsed = JSON.parse(topoGroupStr);
        applicationName = parsed?.[0]?.details?.name || '';
      }
    } catch {
      // ignore
    }

    parsed.push({
      severity,
      severityLabel: SEVERITIES[severity] || String(severity),
      summary: fields[summaryIdx] || '',
      resourceName: fields[resourceIdx] || '',
      senderName: fields[senderIdx] || '',
      typeClassification: fields[typeIdx] || '',
      firstOccurrenceTime: fields[firstOccIdx] || '',
      lastOccurrenceTime: fields[lastOccIdx] || '',
      acknowledged: fields[ackIdx] === 'true',
      hasIncident,
      hasRunbook,
      hasCausalRelationship,
      applicationName,
    });
  });

  return parsed
    .sort((a, b) => {
      if (b.severity !== a.severity) return b.severity - a.severity;
      return (a.firstOccurrenceTime > b.firstOccurrenceTime ? 1 : -1);
    })
    .slice(0, 20);
}
