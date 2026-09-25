/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery } from '../helpers/useQuery';
import { ALERT_QUERY_PARAMS } from '../components/constants';
import createPanel from '../app/createPanel';
import AlertSummaryDashboard from '../components/alert-summary-dashboard/AlertSummaryDashboard';

const TENANT_ID = ALERT_QUERY_PARAMS.tenantId;

/** getAlerts: only need severity + resource.name columns for location counts */
const ALERTS_PARAMS = {
  tenantId: TENANT_ID,
  columns: ['severity', 'resource.name'],
  filter: "state != 'clear'",
  format: 'AIOPS',
};

/** getAlertSummary: overall severity distribution */
const SUMMARY_PARAMS = {
  tenantId: TENANT_ID,
  filter: "state != 'clear'",
  groupBy: ['severity'],
};

const AlertSummaryDashboardPanel = (props: any) => {
  const alertsQuery = useQuery('getAlerts', ALERTS_PARAMS);
  const alertSummaryQuery = useQuery('getAlertSummary', SUMMARY_PARAMS);

  return React.createElement(AlertSummaryDashboard, {
    ...props,
    alertsQuery,
    alertSummaryQuery,
  });
};

export default createPanel(AlertSummaryDashboardPanel);
