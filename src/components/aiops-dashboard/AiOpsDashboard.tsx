/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import ReactDOM from 'react-dom/client';
// @ts-ignore
import { LineChart, SimpleBarChart, PieChart } from '@carbon/charts-react';
// @ts-ignore
import getReactRenderer from '@ibm/akora-renderer-react';
import {
  Button,
  InlineLoading,
  Tag,
} from '@carbon/react';
import getKpiCounts from '../../helpers/getKpiCounts';
import getIncidentTimeCounts from '../../helpers/getIncidentTimeCounts';
import getCriticalAlerts from '../../helpers/getCriticalAlerts';
import getTopApplications from '../../helpers/getTopApplications';
import getSourceBreakdown from '../../helpers/getSourceBreakdown';
import buildAiContext from '../../helpers/buildAiContext';
import { useAiSummary } from '../../helpers/useAiSummary';
import { COLORS, PRIORITY_COLORS, PLEASANT_COLORS, SEVERITIES } from '../constants';

import '@carbon/charts-react/styles.css';
import './aiops-dashboard.scss';

const ReactRenderer = getReactRenderer(React, ReactDOM);
const { useAkoraState } = ReactRenderer.components;

const CLASS = 'aiops-dashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const severityTagType = (sev: number): string => {
  if (sev >= 6) return 'red';
  if (sev === 5) return 'orange';
  if (sev === 4) return 'yellow';
  return 'gray';
};

const formatTime = (iso: string): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

// ---------------------------------------------------------------------------
// Sub-components (inline — only used here)
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string;
  value: number | string;
  severity?: 'critical' | 'major' | 'normal' | 'info';
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, severity = 'normal' }) => (
  <div className={`${CLASS}__kpi-card ${CLASS}__kpi-card--${severity}`}>
    <div className={`${CLASS}__kpi-value`}>{value}</div>
    <div className={`${CLASS}__kpi-label`}>{label}</div>
  </div>
);

interface AiCardProps {
  summary: string | null;
  loading: boolean;
  error: string | null;
  endpointUrl: string | undefined;
  onRefresh: () => void;
}

const AiCard: React.FC<AiCardProps> = ({ summary, loading, error, endpointUrl, onRefresh }) => {
  const renderBody = () => {
    if (!endpointUrl) {
      return (
        <p className={`${CLASS}__ai-empty`}>
          AI Operations Insight is not configured.
        </p>
      );
    }
    if (loading) {
      return <InlineLoading description="Generating insight…" />;
    }
    if (error) {
      return <p className={`${CLASS}__ai-error`}>Error: {error}</p>;
    }
    if (!summary) {
      return (
        <p className={`${CLASS}__ai-empty`}>
          Click <strong>Generate</strong> to produce an AI-assisted operational summary.
        </p>
      );
    }
    return <p className={`${CLASS}__ai-text`}>{summary}</p>;
  };

  return (
    <div className={`${CLASS}__ai-card`}>
      <div className={`${CLASS}__ai-header`}>
        <span className={`${CLASS}__ai-title`}>AI Operations Insight</span>
        {endpointUrl && (
          <Button
            kind="ghost"
            size="sm"
            disabled={loading}
            onClick={onRefresh}
          >
            {summary ? 'Refresh' : 'Generate'}
          </Button>
        )}
      </div>
      {renderBody()}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const AiOpsDashboard = (props: any) => {
  const { alertsQuery, storiesQuery, alertSummaryQuery, aiopsInsightEndpointUrl } = props;

  const { state, app } = useAkoraState();
  const targetUrl = app.resolvePathExpression(state.path);
  const { title } = app.getStateForPath(targetUrl);

  // ---- raw data ----------------------------------------------------------
  const alertRows: Array<{ fields: (string | null)[] }> =
    alertsQuery?.data?.tenant?.alerts?.rows ?? [];
  const stories: any[] = storiesQuery?.data?.tenant?.stories ?? [];
  const summaryEntries: Array<{ severity: number; count: number }> =
    alertSummaryQuery?.data?.tenant?.alertSummary?.summary ?? [];

  const loading =
    alertsQuery?.loading || storiesQuery?.loading || alertSummaryQuery?.loading;

  // ---- derived data (memoised) ------------------------------------------
  const kpis = useMemo(() => getKpiCounts(summaryEntries, stories), [summaryEntries, stories]);

  const incidentTimeCounts = useMemo(
    () => getIncidentTimeCounts(stories),
    [stories]
  );

  const criticalAlerts = useMemo(() => getCriticalAlerts(alertRows), [alertRows]);

  const topApplications = useMemo(() => getTopApplications(alertRows, 10), [alertRows]);

  const { bySender, byType } = useMemo(
    () => getSourceBreakdown(alertRows),
    [alertRows]
  );

  // ---- AI context --------------------------------------------------------
  const contextDocument = useMemo(
    () =>
      buildAiContext({ kpis, topApplications, bySender, byType, criticalAlerts }),
    [kpis, topApplications, bySender, byType, criticalAlerts]
  );

  const { summary, loading: aiLoading, error: aiError, refresh: refreshAi } = useAiSummary(
    { contextDocument },
    { endpointUrl: aiopsInsightEndpointUrl }
  );

  // ---- chart options ----------------------------------------------------
  const incidentLineOptions = useMemo(
    () => ({
      axes: {
        bottom: {
          title: 'Time',
          mapsTo: 'date',
          scaleType: 'time',
        },
        left: {
          mapsTo: 'value',
          title: 'Incidents',
          scaleType: 'linear',
        },
      },
      curve: 'curveMonotoneX',
      color: {
        scale: {
          'Priority 1': PRIORITY_COLORS[4],
          'Priority 2': PRIORITY_COLORS[3],
          'Priority 3': PRIORITY_COLORS[2],
          'Priority 4': PRIORITY_COLORS[1],
        },
      },
      timeScale: { addSpaceOnEdges: 0 },
      data: { loading },
      height: '280px',
      legend: { enabled: true },
    }),
    [loading]
  );

  const topAppBarOptions = useMemo(
    () => ({
      axes: {
        left: { title: 'Alerts', mapsTo: 'value' },
        bottom: { title: 'Application', mapsTo: 'group', scaleType: 'labels' },
      },
      bars: { maxWidth: 40 },
      data: { loading },
      height: '280px',
      legend: { enabled: false },
      getFillColor: (_g: string, _l: any, _d: any) => PLEASANT_COLORS[4],
    }),
    [loading]
  );

  const topAppBarData = useMemo(
    () => topApplications.map(a => ({ group: a.name, value: a.alertCount })),
    [topApplications]
  );

  const senderPieOptions = useMemo(
    () => ({
      data: { loading },
      height: '260px',
      resizable: true,
      title: 'By Sender',
      legend: { enabled: true },
    }),
    [loading]
  );

  const typePieOptions = useMemo(
    () => ({
      data: { loading },
      height: '260px',
      resizable: true,
      title: 'By Type',
      legend: { enabled: true },
    }),
    [loading]
  );

  // ---- render -----------------------------------------------------------
  return (
    <div className={CLASS} role="main">
      {/* Page title */}
      <div className={`${CLASS}__heading`}>{title || 'AI Operations Dashboard'}</div>

      {/* ---- KPI bar ---- */}
      <div className={`${CLASS}__kpi-row`}>
        <KpiCard label="Total Alerts" value={kpis.totalAlerts} severity="info" />
        <KpiCard label="Critical Alerts" value={kpis.criticalAlerts} severity="critical" />
        <KpiCard label="Major Alerts" value={kpis.majorAlerts} severity="major" />
        <KpiCard label="Total Incidents" value={kpis.totalIncidents} severity="info" />
        <KpiCard label="P1 Incidents" value={kpis.p1Incidents} severity="critical" />
        <KpiCard label="Unassigned" value={kpis.unassignedIncidents} severity="major" />
      </div>

      {/* ---- AI insight card ---- */}
      <AiCard
        summary={summary}
        loading={aiLoading}
        error={aiError}
        endpointUrl={aiopsInsightEndpointUrl}
        onRefresh={refreshAi}
      />

      {/* ---- Incident trend line chart ---- */}
      <div className={`${CLASS}__section`}>
        <div className={`${CLASS}__section-title`}>Incident Trend (by priority)</div>
        <LineChart
          data={incidentTimeCounts}
          options={incidentLineOptions}
        />
      </div>

      {/* ---- Top applications bar chart ---- */}
      <div className={`${CLASS}__section`}>
        <div className={`${CLASS}__section-title`}>Top Applications by Alert Count</div>
        {topAppBarData.length > 0 ? (
          <SimpleBarChart data={topAppBarData} options={topAppBarOptions} />
        ) : (
          <p className={`${CLASS}__empty`}>No topology group data available.</p>
        )}
      </div>

      {/* ---- Source breakdown pie charts ---- */}
      <div className={`${CLASS}__row`}>
        <div className={`${CLASS}__section ${CLASS}__section--half`}>
          <div className={`${CLASS}__section-title`}>Alert Source Breakdown</div>
          {bySender.length > 0 ? (
            // @ts-ignore
            <PieChart data={bySender} options={senderPieOptions} />
          ) : (
            <p className={`${CLASS}__empty`}>No sender data available.</p>
          )}
        </div>
        <div className={`${CLASS}__section ${CLASS}__section--half`}>
          <div className={`${CLASS}__section-title`}>Alert Type Breakdown</div>
          {byType.length > 0 ? (
            // @ts-ignore
            <PieChart data={byType} options={typePieOptions} />
          ) : (
            <p className={`${CLASS}__empty`}>No type data available.</p>
          )}
        </div>
      </div>

      {/* ---- Critical alerts table ---- */}
      <div className={`${CLASS}__section`}>
        <div className={`${CLASS}__section-title`}>Critical & Major Alerts</div>
        {criticalAlerts.length === 0 ? (
          <p className={`${CLASS}__empty`}>No critical or major alerts.</p>
        ) : (
          <div className={`${CLASS}__table-wrapper`}>
            <table className={`${CLASS}__table`}>
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Summary</th>
                  <th>Resource</th>
                  <th>Application</th>
                  <th>Sender</th>
                  <th>First Occurrence</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {criticalAlerts.map((alert, idx) => (
                  <tr key={idx}>
                    <td>
                      <Tag type={severityTagType(alert.severity) as any} size="sm">
                        {alert.severityLabel}
                      </Tag>
                    </td>
                    <td className={`${CLASS}__table-summary`}>{alert.summary}</td>
                    <td>{alert.resourceName || '—'}</td>
                    <td>{alert.applicationName || '—'}</td>
                    <td>{alert.senderName}</td>
                    <td>{formatTime(alert.firstOccurrenceTime)}</td>
                    <td className={`${CLASS}__table-flags`}>
                      {alert.hasIncident && (
                        <span title="Has incident">🔗</span>
                      )}
                      {alert.hasRunbook && (
                        <span title="Has runbook">📋</span>
                      )}
                      {alert.hasCausalRelationship && (
                        <span title="Causal relationship">⚡</span>
                      )}
                      {alert.acknowledged && (
                        <span title="Acknowledged">✓</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AiOpsDashboard;
