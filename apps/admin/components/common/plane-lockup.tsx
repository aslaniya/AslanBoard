/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";

type PlaneLockupProps = {
  width?: string | number;
  height?: string | number;
  className?: string;
  color?: string;
};

export function PlaneLockup({ width = "180", height = "28", className, color = "currentColor" }: PlaneLockupProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 180 28"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="AslanBoard"
    >
      <text
        x="0"
        y="22"
        fill={color}
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize="22"
        letterSpacing="-0.6"
      >
        AslanBoard
      </text>
    </svg>
  );
}
