/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane package imports
import React from "react";
import type { IAnalyticsResponseFields } from "@plane/types";
import { Loader } from "@plane/ui";
import { cn } from "@plane/utils";

export type InsightCardProps = {
  data?: IAnalyticsResponseFields;
  label: string;
  isLoading?: boolean;
  href?: string;
  onClick?: () => void;
};

function InsightCard(props: InsightCardProps) {
  const { data, label, isLoading = false, href, onClick } = props;
  const count = data?.count ?? 0;
  const isInteractive = Boolean(href || onClick);

  const countNode = (
    <div
      className={cn(
        "text-20 font-bold text-primary",
        isInteractive && "cursor-pointer underline-offset-2 hover:underline focus-visible:underline"
      )}
    >
      {count}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="text-13 text-tertiary">{label}</div>
      {!isLoading ? (
        <div className="flex flex-col gap-1">
          {href ? (
            <a href={href} onClick={onClick} className="w-fit outline-none">
              {countNode}
            </a>
          ) : onClick ? (
            <button type="button" onClick={onClick} className="w-fit outline-none">
              {countNode}
            </button>
          ) : (
            countNode
          )}
        </div>
      ) : (
        <Loader.Item height="50px" width="100%" />
      )}
    </div>
  );
}

export default InsightCard;
