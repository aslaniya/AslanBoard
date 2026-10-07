/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EditIcon, PlusIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueServiceType, TIssueWorkLog } from "@plane/types";
import { EUserPermissions } from "@plane/types";
import { Avatar, Collapsible, CollapsibleButton, CustomMenu } from "@plane/ui";
import { formatWorkLogDuration, getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// local imports
import { LogTimeModal } from "./log-time-modal";
import { useWorkLogs } from "./use-work-logs";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
  issueServiceType: TIssueServiceType;
};

export const WorkLogCollapsible = observer(function WorkLogCollapsible(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled, issueServiceType } = props;
  const { t } = useTranslation();
  const { openWidgets, toggleOpenWidget } = useIssueDetail(issueServiceType);
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  const { workLogs, totalMinutes, deleteWorkLog } = useWorkLogs(workspaceSlug, projectId, issueId);
  const [modalState, setModalState] = useState<{ isOpen: boolean; workLog: TIssueWorkLog | null }>({
    isOpen: false,
    workLog: null,
  });

  if (workLogs.length === 0) return null;

  const isOpen = openWidgets.includes("work-log");
  const isProjectAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );
  const canModify = (workLog: TIssueWorkLog) => !disabled && (workLog.logged_by === currentUser?.id || isProjectAdmin);

  const handleDelete = async (workLogId: string) => {
    try {
      await deleteWorkLog(workLogId);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("work_log.toast.deleted") });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error.label"), message: t("work_log.toast.delete_failed") });
    }
  };

  return (
    <>
      <Collapsible
        isOpen={isOpen}
        onToggle={() => toggleOpenWidget("work-log")}
        buttonClassName="w-full"
        title={
          <CollapsibleButton
            isOpen={isOpen}
            title={t("work_log.title")}
            indicatorElement={
              <span className="flex items-center justify-center">
                <p className="text-14 !leading-3 text-tertiary">{formatWorkLogDuration(totalMinutes)}</p>
              </span>
            }
            actionItemElement={
              !disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setModalState({ isOpen: true, workLog: null });
                  }}
                  aria-label={t("work_log.log_time")}
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              )
            }
          />
        }
      >
        <div className="flex flex-col gap-1 py-2">
          {workLogs.map((workLog) => (
            <div
              key={workLog.id}
              className="group flex items-start gap-3 rounded-sm border-[0.5px] border-subtle bg-surface-2 px-3 py-2 hover:bg-layer-1"
            >
              <Avatar
                name={workLog.logged_by_detail?.display_name}
                src={getFileURL(workLog.logged_by_detail?.avatar_url ?? "")}
                size={20}
                shape="circle"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 text-body-xs-regular">
                  <span className="text-secondary">{workLog.logged_by_detail?.display_name}</span>
                  <span className="font-medium text-primary">{formatWorkLogDuration(workLog.duration)}</span>
                  <span className="text-placeholder">{renderFormattedDate(workLog.logged_at)}</span>
                </div>
                {workLog.description && (
                  <p className="mt-0.5 text-body-xs-regular break-words whitespace-pre-wrap text-secondary">
                    {workLog.description}
                  </p>
                )}
              </div>
              {canModify(workLog) && (
                <CustomMenu
                  ellipsis
                  buttonClassName="text-placeholder group-hover:text-secondary"
                  placement="bottom-end"
                  closeOnSelect
                >
                  <CustomMenu.MenuItem
                    className="flex items-center gap-2"
                    onClick={() => setModalState({ isOpen: true, workLog })}
                  >
                    <EditIcon className="h-3 w-3 stroke-[1.5] text-secondary" />
                    {t("common.actions.edit")}
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => handleDelete(workLog.id)}>
                    <TrashIcon className="h-3 w-3" />
                    {t("common.actions.delete")}
                  </CustomMenu.MenuItem>
                </CustomMenu>
              )}
            </div>
          ))}
        </div>
      </Collapsible>
      <LogTimeModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, workLog: null })}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
        workLog={modalState.workLog}
      />
    </>
  );
});
