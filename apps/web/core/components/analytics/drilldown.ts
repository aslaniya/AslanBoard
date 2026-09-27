/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { ChartXAxisProperty } from "@plane/types";
import type { TAnalyticsTabsBase, TWorkItemFilterExpression } from "@plane/types";
import { COLLECTION_OPERATOR, LOGICAL_OPERATOR } from "@plane/types";

export type TAnalyticsDrilldownContext = {
  workspaceSlug: string;
  selectedProjects?: string[];
  selectedCycle?: string;
  selectedModule?: string;
};

const WORK_ITEM_STATE_GROUP_BY_INSIGHT_KEY: Record<string, string> = {
  started_work_items: "started",
  backlog_work_items: "backlog",
  un_started_work_items: "unstarted",
  completed_work_items: "completed",
};

const appendSelectionParams = (params: URLSearchParams, context: TAnalyticsDrilldownContext) => {
  if (context.selectedProjects && context.selectedProjects.length > 0) {
    params.set("project_ids", context.selectedProjects.join(","));
  }
  if (context.selectedCycle) {
    params.set("cycle_id", context.selectedCycle);
  }
  if (context.selectedModule) {
    params.set("module_id", context.selectedModule);
  }
};

const allIssuesPath = (workspaceSlug: string, params?: URLSearchParams) => {
  const query = params?.toString();
  return `/${workspaceSlug}/workspace-views/all-issues${query ? `?${query}` : ""}`;
};

/**
 * Build navigation href for an analytics insight KPI card.
 */
export const getInsightDrilldownHref = (
  analyticsType: TAnalyticsTabsBase,
  insightKey: string,
  context: TAnalyticsDrilldownContext
): string | undefined => {
  const { workspaceSlug } = context;

  if (analyticsType === "work-items") {
    const params = new URLSearchParams();
    appendSelectionParams(params, context);
    const stateGroup = WORK_ITEM_STATE_GROUP_BY_INSIGHT_KEY[insightKey];
    if (stateGroup) {
      params.set("state_group", stateGroup);
    }
    // total_work_items (and unknown keys) → all issues, optionally scoped by project/cycle/module
    return allIssuesPath(workspaceSlug, params);
  }

  // Overview tab destinations
  switch (insightKey) {
    case "total_work_items": {
      const params = new URLSearchParams();
      appendSelectionParams(params, context);
      return allIssuesPath(workspaceSlug, params);
    }
    case "total_projects":
      return `/${workspaceSlug}/projects`;
    case "total_cycles":
      return `/${workspaceSlug}/active-cycles`;
    case "total_users":
    case "total_admins":
    case "total_members":
    case "total_guests":
      return `/${workspaceSlug}/settings/members`;
    case "total_intake": {
      if (context.selectedProjects && context.selectedProjects.length === 1) {
        return `/${workspaceSlug}/projects/${context.selectedProjects[0]}/intake`;
      }
      return `/${workspaceSlug}/projects`;
    }
    default:
      return undefined;
  }
};

/**
 * Build navigation href for a customized-insights chart bar click.
 */
export const getChartBarDrilldownHref = (
  xAxis: ChartXAxisProperty,
  datumKey: string | undefined | null,
  context: TAnalyticsDrilldownContext
): string | undefined => {
  if (!datumKey || ["none", "null"].includes(datumKey.toLowerCase())) return undefined;

  const params = new URLSearchParams();
  appendSelectionParams(params, context);

  switch (xAxis) {
    case ChartXAxisProperty.PRIORITY:
      params.set("priority", datumKey.toLowerCase());
      break;
    case ChartXAxisProperty.STATE_GROUPS:
      params.set("state_group", datumKey.toLowerCase());
      break;
    case ChartXAxisProperty.PROJECTS:
      params.set("project_ids", datumKey);
      break;
    default:
      return undefined;
  }

  return allIssuesPath(context.workspaceSlug, params);
};

/**
 * Convert all-issues URL route filters into a rich filter expression.
 */
export const buildRichFiltersFromRouteParams = (routeFilters: {
  [key: string]: string;
}): TWorkItemFilterExpression => {
  const conditions: Record<string, string>[] = [];
  const inOp = COLLECTION_OPERATOR.IN;

  if (routeFilters.priority) {
    conditions.push({ [`priority__${inOp}`]: routeFilters.priority });
  }
  if (routeFilters.state_group) {
    conditions.push({ [`state_group__${inOp}`]: routeFilters.state_group });
  }
  if (routeFilters.project_ids) {
    conditions.push({ [`project_id__${inOp}`]: routeFilters.project_ids });
  }
  if (routeFilters.cycle_id) {
    conditions.push({ [`cycle_id__${inOp}`]: routeFilters.cycle_id });
  }
  if (routeFilters.module_id) {
    conditions.push({ [`module_id__${inOp}`]: routeFilters.module_id });
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0] as TWorkItemFilterExpression;
  return { [LOGICAL_OPERATOR.AND]: conditions } as TWorkItemFilterExpression;
};

/**
 * Whether the route has any analytics drill-down filter params.
 */
export const hasAnalyticsRouteFilters = (routeFilters: { [key: string]: string }): boolean =>
  Boolean(
    routeFilters.priority ||
      routeFilters.state_group ||
      routeFilters.project_ids ||
      routeFilters.cycle_id ||
      routeFilters.module_id
  );
