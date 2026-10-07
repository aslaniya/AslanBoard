/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { IUserLite } from "../users";

export type TIssueWorkLogEditableFields = {
  /** Time spent in minutes */
  duration: number;
  /** Day the work was done, formatted as YYYY-MM-DD */
  logged_at: string;
  description: string;
};

export type TIssueWorkLog = TIssueWorkLogEditableFields & {
  id: string;
  issue: string;
  project: string;
  workspace: string;
  logged_by: string;
  logged_by_detail: IUserLite;
  created_at: string;
  updated_at: string;
};
