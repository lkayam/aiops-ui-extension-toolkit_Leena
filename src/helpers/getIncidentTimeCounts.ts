/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

type IncidentsByPriority = {
  [groupKey: string]: {
    [hour: string]: number;
  };
};

export type IncidentCountDataPoint = {
  group: string;
  date: string;
  value: number;
};

interface Story {
  priority: number;
  createdTime: string;
}

/**
 * Buckets incidents by createdTime into hourly bins, grouped by priority.
 * Returns { group, date, value }[] suitable for a Carbon LineChart.
 * Follows the same pattern as getTimeGroupCounts.
 * @param stories - Array of story objects from getStories response
 */
export default function getIncidentTimeCounts(
  stories: Story[]
): IncidentCountDataPoint[] {
  const byPriority: IncidentsByPriority = {};
  const result: IncidentCountDataPoint[] = [];

  const chopToHour = (iso: string): string => {
    if (!iso || iso.length < 14) return iso;
    // Truncate to the hour: 'YYYY-MM-DDTHH:' + '00:00.000Z'
    return iso.slice(0, -10) + '00:00.000Z';
  };

  (stories || []).forEach(story => {
    const groupKey = `Priority ${story.priority}`;
    const hour = chopToHour(story.createdTime);

    if (!hour) return;

    if (!byPriority[groupKey]) {
      byPriority[groupKey] = {};
    }
    if (!byPriority[groupKey][hour]) {
      byPriority[groupKey][hour] = 0;
    }
    byPriority[groupKey][hour]++;
  });

  for (const groupKey in byPriority) {
    for (const date of Object.keys(byPriority[groupKey]).sort()) {
      result.push({ group: groupKey, date, value: byPriority[groupKey][date] });
    }
  }

  return result;
}
