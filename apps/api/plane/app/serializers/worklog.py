# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from .base import BaseSerializer
from .user import UserLiteSerializer
from plane.db.models import IssueWorkLog


class IssueWorkLogSerializer(BaseSerializer):
    logged_by_detail = UserLiteSerializer(read_only=True, source="logged_by")

    class Meta:
        model = IssueWorkLog
        fields = [
            "id",
            "issue",
            "project",
            "workspace",
            "logged_by",
            "logged_by_detail",
            "duration",
            "logged_at",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "issue",
            "project",
            "workspace",
            "logged_by",
            "created_at",
            "updated_at",
        ]
