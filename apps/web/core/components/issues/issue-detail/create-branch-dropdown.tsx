/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { observer } from "mobx-react";
import { CopyOutline, GitBranchOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { CustomMenu } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";

type Props = {
  projectIdentifier: string | undefined;
  sequenceId: number | string | undefined;
  title: string | undefined;
  disabled?: boolean;
};

const MAX_SLUG_LENGTH = 40;

/**
 * Build a git-safe branch name: <identifier>-<sequence>-<slugified-title>
 */
export const buildWorkItemBranchName = (
  projectIdentifier: string | undefined,
  sequenceId: number | string | undefined,
  title: string | undefined
): string => {
  const idPart = `${projectIdentifier ?? "item"}-${sequenceId ?? "0"}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const slug = (title ?? "work-item")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  return slug ? `${idPart}-${slug}` : idPart;
};

export const CreateBranchDropdown = observer(function CreateBranchDropdown(props: Props) {
  const { projectIdentifier, sequenceId, title, disabled = false } = props;
  const { t } = useTranslation();

  const branchName = useMemo(
    () => buildWorkItemBranchName(projectIdentifier, sequenceId, title),
    [projectIdentifier, sequenceId, title]
  );
  const gitCommand = `git checkout -b ${branchName}`;

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(gitCommand);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.success"),
        message: t("issue.create_branch.copied"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
      });
    }
  };

  return (
    <CustomMenu
      label={
        <span className="flex items-center gap-1.5">
          <GitBranchOutline className="h-3.5 w-3.5" />
          {t("issue.create_branch.label")}
        </span>
      }
      placement="bottom-end"
      closeOnSelect={false}
      disabled={disabled}
      maxHeight="lg"
      optionsClassName="w-80 p-3"
      buttonClassName="flex items-center gap-1 rounded-md border border-subtle bg-surface-1 px-2.5 py-1.5 text-13 font-medium text-secondary hover:bg-surface-2"
      noChevron
    >
      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <div className="text-11 font-medium uppercase tracking-wide text-tertiary">
          {t("issue.create_branch.git_section")}
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-md border border-subtle bg-surface-2 px-2 py-1.5 text-12 text-secondary">
            {gitCommand}
          </code>
          <IconButton
            variant="secondary"
            size="base"
            icon={CopyOutline}
            onClick={handleCopy}
            aria-label={t("issue.create_branch.copy_command")}
          />
        </div>
      </div>
    </CustomMenu>
  );
});
