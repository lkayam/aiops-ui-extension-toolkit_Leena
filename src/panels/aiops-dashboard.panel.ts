/**
 * © Copyright IBM Corp. 2022, 2025
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useQuery } from '../helpers/useQuery';
import { ALERT_QUERY_PARAMS, INCIDENT_QUERY_PARAMS } from '../components/constants';
import createPanel from '../app/createPanel';
import AiOpsDashboard from '../components/aiops-dashboard/AiOpsDashboard';

const ALERT_SUMMARY_PARAMS = {
  tenantId: ALERT_QUERY_PARAMS.tenantId,
  filter: ALERT_QUERY_PARAMS.filter,
  groupBy: ['severity'],
};

const AiOpsDashboardPanel = (props: any) => {
  const alertsQuery = useQuery('getAlerts', ALERT_QUERY_PARAMS);
  const storiesQuery = useQuery('getStories', INCIDENT_QUERY_PARAMS);
  const alertSummaryQuery = useQuery('getAlertSummary', ALERT_SUMMARY_PARAMS);

  return React.createElement(AiOpsDashboard, {
    ...props,
    alertsQuery,
    storiesQuery,
    alertSummaryQuery,
  });
};

export default createPanel(AiOpsDashboardPanel);
