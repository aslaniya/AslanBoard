/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import type { TIssueWorkLog, TIssueWorkLogEditableFields } from "@plane/types";
// services
import { IssueWorkLogService } from "@/services/issue/issue_work_log.service";

const workLogService = new IssueWorkLogService();

export const WORK_LOGS_KEY = (issueId: string) => `ISSUE_WORK_LOGS_${issueId}`;

export const useWorkLogs = (workspaceSlug: string, projectId: string, issueId: string) => {
  const key = workspaceSlug && projectId && issueId ? WORK_LOGS_KEY(issueId) : null;
  const { data, isLoading } = useSWR(key, () => workLogService.list(workspaceSlug, projectId, issueId), {
    revalidateOnFocus: false,
  });

  const workLogs = useMemo<TIssueWorkLog[]>(() => data ?? [], [data]);
  const totalMinutes = useMemo(() => workLogs.reduce((sum, workLog) => sum + workLog.duration, 0), [workLogs]);

  const revalidate = useCallback(() => mutate(WORK_LOGS_KEY(issueId)), [issueId]);

  const createWorkLog = useCallback(
    async (payload: TIssueWorkLogEditableFields) => {
      const workLog = await workLogService.create(workspaceSlug, projectId, issueId, payload);
      await revalidate();
      return workLog;
    },
    [workspaceSlug, projectId, issueId, revalidate]
  );

  const updateWorkLog = useCallback(
    async (workLogId: string, payload: Partial<TIssueWorkLogEditableFields>) => {
      const workLog = await workLogService.update(workspaceSlug, projectId, issueId, workLogId, payload);
      await revalidate();
      return workLog;
    },
    [workspaceSlug, projectId, issueId, revalidate]
  );

  const deleteWorkLog = useCallback(
    async (workLogId: string) => {
      await workLogService.remove(workspaceSlug, projectId, issueId, workLogId);
      await revalidate();
    },
    [workspaceSlug, projectId, issueId, revalidate]
  );

  return { workLogs, totalMinutes, isLoading, createWorkLog, updateWorkLog, deleteWorkLog };
};
