# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third Party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from .. import BaseViewSet
from plane.app.permissions import ProjectEntityPermission
from plane.app.serializers import IssueWorkLogSerializer
from plane.db.models import Issue, IssueWorkLog, ProjectMember
from plane.db.models.project import ROLE


class IssueWorkLogViewSet(BaseViewSet):
    permission_classes = [ProjectEntityPermission]

    model = IssueWorkLog
    serializer_class = IssueWorkLogSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                project__archived_at__isnull=True,
            )
            .select_related("logged_by")
            .order_by("-logged_at", "-created_at")
            .distinct()
        )

    def _get_visible_issue(self, request, slug, project_id, issue_id):
        issue = Issue.issue_objects.select_related("project").get(
            workspace__slug=slug, project_id=project_id, pk=issue_id
        )
        is_restricted_guest = (
            not issue.project.guest_view_all_features
            and ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=ROLE.GUEST.value,
                is_active=True,
            ).exists()
        )
        if is_restricted_guest and issue.created_by_id != request.user.id:
            raise Issue.DoesNotExist
        return issue

    def _can_modify(self, request, slug, project_id, work_log):
        if work_log.logged_by_id == request.user.id:
            return True
        return ProjectMember.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            member=request.user,
            role=ROLE.ADMIN.value,
            is_active=True,
        ).exists()

    def list(self, request, slug, project_id, issue_id):
        self._get_visible_issue(request, slug, project_id, issue_id)
        serializer = IssueWorkLogSerializer(self.get_queryset(), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def create(self, request, slug, project_id, issue_id):
        issue = self._get_visible_issue(request, slug, project_id, issue_id)
        serializer = IssueWorkLogSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue=issue, logged_by=request.user)
            work_log = self.get_queryset().get(pk=serializer.data.get("id"))
            return Response(IssueWorkLogSerializer(work_log).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def partial_update(self, request, slug, project_id, issue_id, pk):
        work_log = self.get_queryset().get(pk=pk)
        if not self._can_modify(request, slug, project_id, work_log):
            return Response(
                {"error": "You can only edit your own work logs"},
                status=status.HTTP_403_FORBIDDEN,
            )
        serializer = IssueWorkLogSerializer(work_log, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, slug, project_id, issue_id, pk):
        work_log = self.get_queryset().get(pk=pk)
        if not self._can_modify(request, slug, project_id, work_log):
            return Response(
                {"error": "You can only delete your own work logs"},
                status=status.HTTP_403_FORBIDDEN,
            )
        work_log.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
