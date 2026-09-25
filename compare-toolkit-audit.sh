#!/usr/bin/env bash
# ==============================================================================
# compare-toolkit-audit.sh
# 
# Usage:
#   Run directly at the root (head) of any aiops-ui-extension-toolkit repository:
#     ./compare-toolkit-audit.sh
#   Or with output redirected:
#     ./compare-toolkit-audit.sh > audit_report.txt
# ==============================================================================

set -u

BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}======================================================${RESET}"
echo -e "${BOLD}${CYAN}   AIOps UI Extension Toolkit — Audit & Diagnostic    ${RESET}"
echo -e "${BOLD}${CYAN}======================================================${RESET}"
echo "Execution timestamp: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo "Working directory:   $(pwd)"

# ------------------------------------------------------------------------------
# 1. Target & Tenant ID Detection
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[1] Cluster Target & Tenant ID Configuration${RESET}"

if [ -f "target.json" ]; then
  TENANT_ID=$(grep -o '"tenantId": *"[^"]*"' target.json | cut -d'"' -f4 || echo "")
  HOST=$(grep -o '"host": *"[^"]*"' target.json | cut -d'"' -f4 || echo "")
  echo -e "  target.json:      ${GREEN}EXISTS${RESET}"
  echo -e "  Configured Host:  ${CYAN}${HOST:-N/A}${RESET}"
  echo -e "  Tenant ID:        ${CYAN}${TENANT_ID:-N/A}${RESET}"
else
  echo -e "  target.json:      ${RED}MISSING${RESET}"
  TENANT_ID=""
fi

# Check for placeholder in source code
PLACEHOLDER_MATCHES=$(grep -rn "YOUR_TENANT_ID_HERE" src/ 2>/dev/null || true)
if [ -n "$PLACEHOLDER_MATCHES" ]; then
  echo -e "  Placeholder Check: ${RED}FAILED${RESET} — 'YOUR_TENANT_ID_HERE' found in:"
  echo "$PLACEHOLDER_MATCHES" | sed 's/^/    /'
else
  echo -e "  Placeholder Check: ${GREEN}PASSED${RESET} (No unreplaced 'YOUR_TENANT_ID_HERE' tokens found)"
fi

# ------------------------------------------------------------------------------
# 2. Helper Modules Check (src/helpers/)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[2] Required Custom Helper Modules (src/helpers/)${RESET}"

REQUIRED_HELPERS=(
  "getKpiCounts.ts"
  "getIncidentTimeCounts.ts"
  "getCriticalAlerts.ts"
  "getTopApplications.ts"
  "getSourceBreakdown.ts"
  "buildAiContext.ts"
  "useAiSummary.ts"
  "getAlertSeverityCounts.ts"
  "getAlertLocationCounts.ts"
  "getAlertSeverityByFilter.ts"
)

MISSING_HELPERS_COUNT=0
for helper in "${REQUIRED_HELPERS[@]}"; do
  if [ -f "src/helpers/$helper" ]; then
    echo -e "  - src/helpers/$helper: ${GREEN}PRESENT${RESET}"
  else
    echo -e "  - src/helpers/$helper: ${RED}MISSING${RESET}"
    MISSING_HELPERS_COUNT=$((MISSING_HELPERS_COUNT + 1))
  fi
done

# ------------------------------------------------------------------------------
# 3. Panel Wiring Files Check (src/panels/)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[3] Panel Wiring Files (src/panels/)${RESET}"

REQUIRED_PANELS=(
  "aiops-dashboard.panel.ts"
  "alert-summary-dashboard.panel.ts"
)

MISSING_PANELS_COUNT=0
for panel in "${REQUIRED_PANELS[@]}"; do
  if [ -f "src/panels/$panel" ]; then
    echo -e "  - src/panels/$panel: ${GREEN}PRESENT${RESET}"
  else
    echo -e "  - src/panels/$panel: ${RED}MISSING${RESET}"
    MISSING_PANELS_COUNT=$((MISSING_PANELS_COUNT + 1))
  fi
done

# ------------------------------------------------------------------------------
# 4. Custom Dashboard Components & Styles (src/components/)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[4] Component & Stylesheet Integrity (src/components/)${RESET}"

COMPONENTS_LIST=(
  "src/components/aiops-dashboard/AiOpsDashboard.tsx"
  "src/components/aiops-dashboard/aiops-dashboard.scss"
  "src/components/alert-summary-dashboard/AlertSummaryDashboard.tsx"
  "src/components/alert-summary-dashboard/alert-summary-dashboard.scss"
)

for comp in "${COMPONENTS_LIST[@]}"; do
  if [ -f "$comp" ]; then
    echo -e "  - $comp: ${GREEN}PRESENT${RESET}"
  else
    echo -e "  - $comp: ${RED}MISSING${RESET}"
  fi
done

# ------------------------------------------------------------------------------
# 5. SDK API Method Correctness (getFilters vs getFiltersViews)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[5] SDK API Method Correctness${RESET}"

DASH_ALERT="src/components/alert-summary-dashboard/AlertSummaryDashboard.tsx"
if [ -f "$DASH_ALERT" ]; then
  if grep -q "getFiltersViews" "$DASH_ALERT"; then
    echo -e "  - SDK API method:  ${GREEN}CORRECT${RESET} (using 'getFiltersViews')"
  elif grep -q "getFilters(" "$DASH_ALERT"; then
    echo -e "  - SDK API method:  ${RED}DEFECT DETECTED${RESET} (using 'getFilters' instead of 'getFiltersViews' — causes runtime error)"
  else
    echo -e "  - SDK API method:  ${YELLOW}NOT FOUND / STUBBED${RESET}"
  fi

  if grep -q "\.filtersViews" "$DASH_ALERT"; then
    echo -e "  - Response Key:    ${GREEN}CORRECT${RESET} (accessing data.tenant.filtersViews)"
  elif grep -q "\.filters\b" "$DASH_ALERT"; then
    echo -e "  - Response Key:    ${RED}DEFECT DETECTED${RESET} (accessing data.tenant.filters instead of .filtersViews)"
  fi
else
  echo -e "  - $DASH_ALERT: ${RED}NOT FOUND${RESET}"
fi

# ------------------------------------------------------------------------------
# 6. Panel Registration in src/index.js
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[6] Panel Registration in src/index.js${RESET}"

if [ -f "src/index.js" ]; then
  for panelId in "aiops-dashboard" "alert-summary-dashboard"; do
    if grep -q "registerCustomPanel('$panelId'" src/index.js || grep -q "registerCustomPanel(\"$panelId\"" src/index.js; then
      echo -e "  - window.registerCustomPanel('$panelId'): ${GREEN}REGISTERED${RESET}"
    else
      echo -e "  - window.registerCustomPanel('$panelId'): ${RED}NOT REGISTERED${RESET}"
    fi
  done
else
  echo -e "  - src/index.js: ${RED}NOT FOUND${RESET}"
fi

# ------------------------------------------------------------------------------
# 7. Route Configuration Check
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[7] Route Definitions Check${RESET}"

ROUTES_FILE=""
if [ -f "config-routes.json" ]; then
  ROUTES_FILE="config-routes.json"
elif [ -f "config/routes.json" ]; then
  ROUTES_FILE="config/routes.json"
fi

if [ -n "$ROUTES_FILE" ]; then
  echo -e "  Checking routes file: ${CYAN}$ROUTES_FILE${RESET}"
  for r in "/aiops-dashboard" "/alert-summary-dashboard"; do
    if grep -q "$r" "$ROUTES_FILE"; then
      echo -e "  - Route '$r': ${GREEN}FOUND${RESET}"
    else
      echo -e "  - Route '$r': ${RED}MISSING${RESET}"
    fi
  done
else
  echo -e "  - No routes configuration file found: ${RED}FAILED${RESET}"
fi

# ------------------------------------------------------------------------------
# 8. OpenShift / Cluster Resource Check (if 'oc' is available)
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}[8] Cluster CR Status Check${RESET}"
if command -v oc &>/dev/null; then
  CURRENT_NS=$(oc project -q 2>/dev/null || echo "concert-operate")
  echo "  Current OpenShift namespace: $CURRENT_NS"
  
  CR_EXISTS=$(oc get aiopsuiextension -n "$CURRENT_NS" alerts-examples-custom-dashboards 2>/dev/null || echo "")
  if [ -n "$CR_EXISTS" ]; then
    echo -e "  - AIOpsUIExtension CR (alerts-examples-custom-dashboards): ${GREEN}EXISTS${RESET}"
  else
    echo -e "  - AIOpsUIExtension CR (alerts-examples-custom-dashboards): ${YELLOW}NOT FOUND${RESET} (May need manual oc apply)"
  fi

  ZEN_EXT=$(oc get zenextension -n "$CURRENT_NS" aiops-extensions-ext 2>/dev/null || echo "")
  if [ -n "$ZEN_EXT" ]; then
    echo -e "  - ZenExtension CR (aiops-extensions-ext): ${GREEN}EXISTS${RESET}"
  else
    echo -e "  - ZenExtension CR (aiops-extensions-ext): ${YELLOW}NOT FOUND${RESET}"
  fi
else
  echo "  (oc command not found or not connected — skipping cluster CR checks)"
fi

# ------------------------------------------------------------------------------
# Summary Verdict
# ------------------------------------------------------------------------------
echo -e "\n${BOLD}${CYAN}======================================================${RESET}"
echo -e "${BOLD}${CYAN}                 EXECUTIVE AUDIT SUMMARY              ${RESET}"
echo -e "${BOLD}${CYAN}======================================================${RESET}"

TOTAL_ERRORS=0
[ "$MISSING_HELPERS_COUNT" -gt 0 ] && TOTAL_ERRORS=$((TOTAL_ERRORS + MISSING_HELPERS_COUNT))
[ "$MISSING_PANELS_COUNT" -gt 0 ] && TOTAL_ERRORS=$((TOTAL_ERRORS + MISSING_PANELS_COUNT))
[ -n "$PLACEHOLDER_MATCHES" ] && TOTAL_ERRORS=$((TOTAL_ERRORS + 1))

if [ "$TOTAL_ERRORS" -eq 0 ]; then
  echo -e "${GREEN}${BOLD}STATUS: READY TO BUILD & RUN${RESET}"
  echo "All required components, helper utilities, panel wirings, and registrations are in place."
else
  echo -e "${RED}${BOLD}STATUS: INCOMPLETE / WILL RENDER BLANK PAGES (${TOTAL_ERRORS} issue(s) identified)${RESET}"
  echo "Differences identified against reference working lab:"
  [ "$MISSING_HELPERS_COUNT" -gt 0 ] && echo "  - Missing $MISSING_HELPERS_COUNT helper function(s) in src/helpers/"
  [ "$MISSING_PANELS_COUNT" -gt 0 ] && echo "  - Missing $MISSING_PANELS_COUNT panel wiring file(s) in src/panels/"
  [ -n "$PLACEHOLDER_MATCHES" ] && echo "  - Hardcoded 'YOUR_TENANT_ID_HERE' string present"
fi
echo -e "${BOLD}${CYAN}======================================================${RESET}\n"
