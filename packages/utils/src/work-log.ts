/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Jira-style units: a working day is 8 hours and a working week is 5 days.
const MINUTES_PER_UNIT: Record<string, number> = {
  w: 5 * 8 * 60,
  d: 8 * 60,
  h: 60,
  m: 1,
};

/** Must match MAX_WORK_LOG_DURATION_MINUTES on the API. */
export const MAX_WORK_LOG_DURATION_MINUTES = 7 * 24 * 60;

/**
 * Parses a Jira-style duration such as "2h 30m", "1d", "1w 2d" or "1.5" (hours) into minutes.
 * Returns null when the input is empty, malformed, or not a positive whole number of minutes.
 */
export const parseWorkLogDuration = (input: string): number | null => {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  if (/^\d+(\.\d+)?$/.test(value)) {
    const minutes = Math.round(parseFloat(value) * 60);
    return minutes > 0 ? minutes : null;
  }

  const tokens = value.split(/\s+/);
  let total = 0;
  for (const token of tokens) {
    const match = /^(\d+(?:\.\d+)?)([wdhm])$/.exec(token);
    if (!match) return null;
    total += parseFloat(match[1]) * MINUTES_PER_UNIT[match[2]];
  }

  const minutes = Math.round(total);
  return minutes > 0 ? minutes : null;
};

/** Formats minutes as "3h 15m", "45m" or "2h". */
export const formatWorkLogDuration = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};
