/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { cn, formatWorkLogDuration } from "@plane/utils";
// local imports
import { LogTimeModal } from "./log-time-modal";
import { useWorkLogs } from "./use-work-logs";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export function WorkLogSidebarProperty(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const { t } = useTranslation();
  const { totalMinutes } = useWorkLogs(workspaceSlug, projectId, issueId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={disabled}
        className={cn(
          "flex h-7.5 w-full items-center rounded-sm px-2 text-left text-body-xs-regular hover:bg-layer-transparent-hover",
          { "text-placeholder": totalMinutes === 0, "cursor-not-allowed": disabled }
        )}
      >
        {totalMinutes > 0
          ? t("work_log.total_logged", { duration: formatWorkLogDuration(totalMinutes) })
          : t("work_log.log_time")}
      </button>
      <LogTimeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        issueId={issueId}
      />
    </>
  );
}
