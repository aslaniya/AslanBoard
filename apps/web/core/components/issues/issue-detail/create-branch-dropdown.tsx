/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
