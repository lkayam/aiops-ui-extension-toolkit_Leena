/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

export interface KpiCounts {
  totalAlerts: number;
  criticalAlerts: number;
  majorAlerts: number;
  totalIncidents: number;
  p1Incidents: number;
  unassignedIncidents: number;
}

interface AlertSummaryEntry {
  severity: number;
  count: number;
}

interface Story {
  priority: number;
  state: string;
}

/**
 * Derives the 6 executive KPI values from the alertSummary and stories arrays.
 * @param summaryEntries - Array of { severity, count } from getAlertSummary response
 * @param stories - Array of story objects from getStories response
 */
export default function getKpiCounts(
  summaryEntries: AlertSummaryEntry[],
  stories: Story[]
): KpiCounts {
  const entries = summaryEntries || [];
  const storyList = stories || [];

  const totalAlerts = entries.reduce((acc, s) => acc + (s.count || 0), 0);
  const criticalAlerts = entries.find(s => s.severity === 6)?.count ?? 0;
  const majorAlerts = entries.find(s => s.severity === 5)?.count ?? 0;

  const totalIncidents = storyList.length;
  const p1Incidents = storyList.filter(s => s.priority === 1).length;
  const unassignedIncidents = storyList.filter(s => s.state === 'unassigned').length;

  return { totalAlerts, criticalAlerts, majorAlerts, totalIncidents, p1Incidents, unassignedIncidents };
}
