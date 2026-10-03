# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

# Module imports
from .project import ProjectBaseModel

# A single entry can't exceed one week of work
MAX_WORK_LOG_DURATION_MINUTES = 7 * 24 * 60


def current_date():
    return timezone.now().date()


class IssueWorkLog(ProjectBaseModel):
    issue = models.ForeignKey("db.Issue", on_delete=models.CASCADE, related_name="issue_worklogs")
    logged_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_worklogs",
    )
    duration = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(MAX_WORK_LOG_DURATION_MINUTES)],
        help_text="Time spent in minutes",
    )
    logged_at = models.DateField(default=current_date)
    description = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Issue Work Log"
        verbose_name_plural = "Issue Work Logs"
        db_table = "issue_worklogs"
        ordering = ("-logged_at", "-created_at")
        indexes = [models.Index(fields=["issue", "logged_at"], name="issue_worklog_issue_date_idx")]

    def __str__(self):
        return f"{self.issue_id} {self.logged_by_id} {self.duration}m"
