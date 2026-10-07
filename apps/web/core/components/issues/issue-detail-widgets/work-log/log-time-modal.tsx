/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TIssueWorkLog } from "@plane/types";
import { Input, ModalCore, TextArea } from "@plane/ui";
import {
  MAX_WORK_LOG_DURATION_MINUTES,
  formatWorkLogDuration,
  parseWorkLogDuration,
  renderFormattedPayloadDate,
} from "@plane/utils";
// local imports
import { useWorkLogs } from "./use-work-logs";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  workLog?: TIssueWorkLog | null;
};

type TFormValues = {
  duration: string;
  logged_at: string;
  description: string;
};

const getDefaultValues = (workLog?: TIssueWorkLog | null): TFormValues => ({
  duration: workLog ? formatWorkLogDuration(workLog.duration) : "",
  logged_at: workLog?.logged_at ?? renderFormattedPayloadDate(new Date()) ?? "",
  description: workLog?.description ?? "",
});

export function LogTimeModal(props: Props) {
  const { isOpen, onClose, workspaceSlug, projectId, issueId, workLog } = props;
  const { t } = useTranslation();
  const { createWorkLog, updateWorkLog } = useWorkLogs(workspaceSlug, projectId, issueId);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TFormValues>({ defaultValues: getDefaultValues(workLog) });

  useEffect(() => {
    if (isOpen) reset(getDefaultValues(workLog));
  }, [isOpen, workLog, reset]);

  const onSubmit = async (values: TFormValues) => {
    const duration = parseWorkLogDuration(values.duration);
    if (!duration) return;
    const payload = { duration, logged_at: values.logged_at, description: values.description.trim() };
    try {
      if (workLog) await updateWorkLog(workLog.id, payload);
      else await createWorkLog(payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("work_log.toast.saved") });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: t("common.error.label"), message: t("work_log.toast.save_failed") });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-h4-medium text-secondary">{workLog ? t("work_log.edit") : t("work_log.log_time")}</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="work-log-duration" className="mb-2 block text-secondary">
                {t("work_log.time_spent")}
              </label>
              <Controller
                control={control}
                name="duration"
                rules={{
                  validate: (value) => {
                    const minutes = parseWorkLogDuration(value);
                    if (!minutes) return t("work_log.validation.invalid_duration");
                    if (minutes > MAX_WORK_LOG_DURATION_MINUTES) return t("work_log.validation.too_long");
                    return true;
                  },
                }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="work-log-duration"
                    type="text"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.duration)}
                    placeholder="2h 30m"
                    className="w-full"
                  />
                )}
              />
              {errors.duration ? (
                <span className="text-caption-sm-regular text-danger-primary">{errors.duration.message}</span>
              ) : (
                <span className="text-caption-sm-regular text-tertiary">{t("work_log.duration_hint")}</span>
              )}
            </div>
            <div>
              <label htmlFor="work-log-date" className="mb-2 block text-secondary">
                {t("work_log.date")}
              </label>
              <Controller
                control={control}
                name="logged_at"
                rules={{ required: true }}
                render={({ field: { value, onChange, ref } }) => (
                  <Input
                    id="work-log-date"
                    type="date"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    hasError={Boolean(errors.logged_at)}
                    max={renderFormattedPayloadDate(new Date()) ?? undefined}
                    className="w-full"
                  />
                )}
              />
            </div>
            <div>
              <label htmlFor="work-log-description" className="mb-2 block text-secondary">
                {t("work_log.description")}
                <span className="block text-caption-xs-regular">{t("common.optional")}</span>
              </label>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, ref } }) => (
                  <TextArea
                    id="work-log-description"
                    value={value}
                    onChange={onChange}
                    ref={ref}
                    placeholder={t("work_log.description_placeholder")}
                    className="min-h-20 w-full"
                  />
                )}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-subtle px-5 py-4">
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button variant="primary" size="lg" type="submit" loading={isSubmitting}>
            {workLog ? t("common.update") : t("work_log.log_time")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
