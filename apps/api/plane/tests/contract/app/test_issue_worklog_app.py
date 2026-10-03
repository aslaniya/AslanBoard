# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Contract tests for ``IssueWorkLogViewSet`` (Jira-style time logging on work items)."""

from uuid import uuid4

import pytest
from rest_framework import status
from rest_framework.test import APIClient

from plane.db.models import (
    Issue,
    IssueWorkLog,
    Project,
    ProjectMember,
    User,
    Workspace,
    WorkspaceMember,
)
from plane.db.models.worklog import MAX_WORK_LOG_DURATION_MINUTES

LIST_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/"
DETAIL_URL = "/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{pk}/"


def _make_user(prefix):
    unique_id = uuid4().hex[:8]
    return User.objects.create(
        email=f"{prefix}-{unique_id}@plane.so",
        username=f"{prefix}_{unique_id}",
        first_name=prefix.title(),
        last_name="User",
    )


def _client_for(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def _add_member(workspace, project, user, role):
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=role)
    ProjectMember.objects.create(project=project, member=user, workspace=workspace, role=role)


def _make_issue(name, project, workspace, author):
    issue = Issue(name=name, project=project, workspace=workspace)
    issue.save(created_by_id=author.id)
    return issue


@pytest.fixture
def project(db, workspace, create_user):
    project = Project.objects.create(
        name="Time Tracking",
        identifier="TT",
        workspace=workspace,
        created_by=create_user,
    )
    ProjectMember.objects.create(project=project, member=create_user, workspace=workspace, role=20)
    return project


@pytest.fixture
def issue(db, workspace, project, create_user):
    return _make_issue("Build the thing", project, workspace, create_user)


@pytest.fixture
def member(db, workspace, project):
    user = _make_user("member")
    _add_member(workspace, project, user, role=15)
    return user


@pytest.fixture
def guest(db, workspace, project):
    user = _make_user("guest")
    _add_member(workspace, project, user, role=5)
    return user


def _list_url(workspace, project, issue):
    return LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id)


def _detail_url(workspace, project, issue, work_log):
    return DETAIL_URL.format(slug=workspace.slug, project_id=project.id, issue_id=issue.id, pk=work_log.id)


def _log(issue, user, duration=60):
    return IssueWorkLog.objects.create(
        issue=issue, project=issue.project, logged_by=user, duration=duration, description="work"
    )


@pytest.mark.contract
class TestIssueWorkLogCreateAndList:
    @pytest.mark.django_db
    def test_member_logs_time_and_lists_it(self, workspace, project, issue, member):
        client = _client_for(member)
        response = client.post(
            _list_url(workspace, project, issue),
            {"duration": 150, "logged_at": "2026-10-01", "description": "Pairing session"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert response.data["duration"] == 150
        assert str(response.data["logged_by"]) == str(member.id)
        assert response.data["logged_by_detail"]["id"] == member.id
        assert str(response.data["issue"]) == str(issue.id)

        listed = client.get(_list_url(workspace, project, issue))
        assert listed.status_code == status.HTTP_200_OK
        assert [row["duration"] for row in listed.data] == [150]

    @pytest.mark.django_db
    def test_logged_by_cannot_be_spoofed(self, workspace, project, issue, member, create_user):
        response = _client_for(member).post(
            _list_url(workspace, project, issue),
            {"duration": 30, "logged_by": str(create_user.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED, response.data
        assert str(response.data["logged_by"]) == str(member.id)

    @pytest.mark.django_db
    @pytest.mark.parametrize("duration", [0, -5, MAX_WORK_LOG_DURATION_MINUTES + 1])
    def test_rejects_out_of_range_duration(self, workspace, project, issue, member, duration):
        response = _client_for(member).post(_list_url(workspace, project, issue), {"duration": duration}, format="json")

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_guest_cannot_log_time(self, workspace, project, issue, guest):
        response = _client_for(guest).post(_list_url(workspace, project, issue), {"duration": 30}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert IssueWorkLog.objects.count() == 0

    @pytest.mark.django_db
    def test_restricted_guest_cannot_read_logs_of_foreign_issue(self, workspace, project, issue, guest, create_user):
        _log(issue, create_user)

        response = _client_for(guest).get(_list_url(workspace, project, issue))

        assert response.status_code == status.HTTP_404_NOT_FOUND

    @pytest.mark.django_db
    def test_guest_with_view_all_can_read_logs(self, workspace, project, issue, guest, create_user):
        project.guest_view_all_features = True
        project.save(update_fields=["guest_view_all_features"])
        _log(issue, create_user)

        response = _client_for(guest).get(_list_url(workspace, project, issue))

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1

    @pytest.mark.django_db
    def test_cannot_log_against_issue_from_another_tenant(self, workspace, project, member):
        other_owner = _make_user("victim")
        other_ws = Workspace.objects.create(name="Other", owner=other_owner, slug=f"other-{uuid4().hex[:8]}")
        other_project = Project.objects.create(
            name="Other Project", identifier="OP", workspace=other_ws, created_by=other_owner
        )
        foreign_issue = _make_issue("Foreign", other_project, other_ws, other_owner)

        url = LIST_URL.format(slug=workspace.slug, project_id=project.id, issue_id=foreign_issue.id)
        response = _client_for(member).post(url, {"duration": 30}, format="json")

        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert IssueWorkLog.objects.count() == 0


@pytest.mark.contract
class TestIssueWorkLogUpdateAndDelete:
    @pytest.mark.django_db
    def test_author_can_edit_and_delete_own_log(self, workspace, project, issue, member):
        work_log = _log(issue, member)
        client = _client_for(member)

        updated = client.patch(_detail_url(workspace, project, issue, work_log), {"duration": 45}, format="json")
        assert updated.status_code == status.HTTP_200_OK, updated.data
        assert updated.data["duration"] == 45

        deleted = client.delete(_detail_url(workspace, project, issue, work_log))
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
        assert not IssueWorkLog.objects.filter(pk=work_log.pk).exists()

    @pytest.mark.django_db
    def test_member_cannot_modify_someone_elses_log(self, workspace, project, issue, member, create_user):
        work_log = _log(issue, create_user, duration=60)
        client = _client_for(member)

        updated = client.patch(_detail_url(workspace, project, issue, work_log), {"duration": 1}, format="json")
        deleted = client.delete(_detail_url(workspace, project, issue, work_log))

        assert updated.status_code == status.HTTP_403_FORBIDDEN
        assert deleted.status_code == status.HTTP_403_FORBIDDEN
        work_log.refresh_from_db()
        assert work_log.duration == 60

    @pytest.mark.django_db
    def test_project_admin_can_modify_any_log(self, session_client, workspace, project, issue, member):
        work_log = _log(issue, member)

        updated = session_client.patch(
            _detail_url(workspace, project, issue, work_log), {"duration": 90}, format="json"
        )
        assert updated.status_code == status.HTTP_200_OK, updated.data
        assert updated.data["duration"] == 90

        deleted = session_client.delete(_detail_url(workspace, project, issue, work_log))
        assert deleted.status_code == status.HTTP_204_NO_CONTENT
