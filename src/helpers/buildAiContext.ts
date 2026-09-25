/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import type { KpiCounts } from './getKpiCounts';
import type { TopApplication } from './getTopApplications';
import type { BreakdownEntry } from './getSourceBreakdown';
import type { CriticalAlert } from './getCriticalAlerts';

interface AiContextInput {
  kpis: KpiCounts;
  topApplications: TopApplication[];
  bySender: BreakdownEntry[];
  byType: BreakdownEntry[];
  criticalAlerts: CriticalAlert[];
}

/**
 * Serialises transformed dashboard data into a plain-text context document
 * suitable for passing to an AI/LLM summarisation endpoint.
 * This is a pure function — no network calls, no side effects.
 */
export default function buildAiContext(input: AiContextInput): string {
  const { kpis, topApplications, bySender, byType, criticalAlerts } = input;

  const lines: string[] = [];

  lines.push('=== AI Operations Dashboard Context ===');
  lines.push('');

  // KPIs
  lines.push('--- Alert & Incident KPIs ---');
  lines.push(`Total open alerts: ${kpis.totalAlerts}`);
  lines.push(`Critical alerts (sev 6): ${kpis.criticalAlerts}`);
  lines.push(`Major alerts (sev 5): ${kpis.majorAlerts}`);
  lines.push(`Total open incidents: ${kpis.totalIncidents}`);
  lines.push(`Priority-1 incidents: ${kpis.p1Incidents}`);
  lines.push(`Unassigned incidents: ${kpis.unassignedIncidents}`);
  lines.push('');

  // Top applications
  if (topApplications.length > 0) {
    lines.push('--- Top Applications by Alert Count ---');
    topApplications.slice(0, 10).forEach(app => {
      lines.push(`${app.name}: ${app.alertCount} alerts, max severity ${app.maxSeverity}`);
    });
    lines.push('');
  }

  // Source breakdown
  if (bySender.length > 0) {
    lines.push('--- Alerts by Sender ---');
    bySender.slice(0, 10).forEach(e => lines.push(`${e.group}: ${e.value}`));
    lines.push('');
  }
  if (byType.length > 0) {
    lines.push('--- Alerts by Type ---');
    byType.slice(0, 10).forEach(e => lines.push(`${e.group}: ${e.value}`));
    lines.push('');
  }

  // Critical alerts table
  if (criticalAlerts.length > 0) {
    lines.push('--- Critical & Major Alerts (top 20) ---');
    criticalAlerts.forEach(a => {
      lines.push(
        `[${a.severityLabel}] ${a.summary} | resource: ${a.resourceName} | sender: ${a.senderName} | app: ${a.applicationName || 'N/A'} | first: ${a.firstOccurrenceTime}`
      );
    });
    lines.push('');
  }

  return lines.join('\n');
}
