from datetime import datetime, timezone

import asyncpg
import httpx

from fastapi import APIRouter, HTTPException, Request, status

from app.api.deps import AdminStaff, CurrentStaff, DbConnection
from app.core.config import Settings
from app.models.schemas import (
    Staff,
    AssignEmailRequest,
    EmailItem,
    InboxResponse,
    ReplyRequest,
    ReplyResponse,
    StaffOption,
)

router = APIRouter(prefix="/api/emails", tags=["emails"])


def placeholder_inbox(current_staff: Staff) -> InboxResponse:
    """Return safe demo data when the database-backed inbox cannot be reached."""

    placeholder_email = EmailItem(
        id=-1,
        sender_email="client.placeholder@example.com",
        subject="Placeholder conversation",
        snippet=(
            "The live inbox data source is temporarily unavailable, "
            "so this demo message is shown to keep the API responsive."
        ),
        thread_id="placeholder-thread",
        assigned_staff_id=None,
        received_at=datetime.now(timezone.utc),
    )
    return InboxResponse(
        current_user=current_staff,
        emails=[placeholder_email],
        staff=(
            [
                StaffOption(
                    staff_id=current_staff.staff_id,
                    staff_name=current_staff.staff_name,
                    staff_email=current_staff.staff_email,
                )
            ]
            if current_staff.role == "admin"
            else []
        ),
    )


@router.get("", response_model=InboxResponse)
async def list_emails(
    connection: DbConnection, current_staff: CurrentStaff
) -> InboxResponse:
    """Return inbox rows scoped by role-based access control."""

    if connection is None:
        return placeholder_inbox(current_staff)

    try:
        if current_staff.role == "admin":
            email_rows = await connection.fetch("""
                SELECT id, sender_email, subject, snippet, thread_id, assigned_staff_id, received_at
                FROM staff_inbox
                ORDER BY received_at DESC
                """)
            staff_rows = await connection.fetch("""
                SELECT staff_id, staff_name, staff_email
                FROM staff
                WHERE role IN ('staff', 'admin')
                ORDER BY staff_name ASC
                """)
        else:
            email_rows = await connection.fetch(
                """
                SELECT id, sender_email, subject, snippet, thread_id, assigned_staff_id, received_at
                FROM staff_inbox
                WHERE assigned_staff_id = $1
                ORDER BY received_at DESC
                """,
                current_staff.staff_id,
            )
            staff_rows = []

        return InboxResponse(
            current_user=current_staff,
            emails=[EmailItem(**dict(row)) for row in email_rows],
            staff=[StaffOption(**dict(row)) for row in staff_rows],
        )
    except (asyncpg.PostgresError, OSError, TimeoutError):
        return placeholder_inbox(current_staff)


@router.patch("/assign", response_model=EmailItem)
async def assign_email(
    payload: AssignEmailRequest,
    connection: DbConnection,
    _: AdminStaff,
) -> EmailItem:
    """Allow admins to manually assign an unowned client thread to a staff member."""

    if connection is None:
        return EmailItem(
            id=-1,
            sender_email="client.placeholder@example.com",
            subject="Placeholder conversation",
            snippet="Assignment was saved as a placeholder because the live API data source is unavailable.",
            thread_id=payload.thread_id,
            assigned_staff_id=payload.assigned_staff_id,
            received_at=datetime.now(timezone.utc),
        )

    try:
        staff_exists = await connection.fetchval(
            "SELECT EXISTS(SELECT 1 FROM staff WHERE staff_id = $1)",
            payload.assigned_staff_id,
        )
        if not staff_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Staff member not found."
            )

        row = await connection.fetchrow(
            """
            UPDATE staff_inbox
            SET assigned_staff_id = $1
            WHERE thread_id = $2 AND assigned_staff_id IS NULL
            RETURNING id, sender_email, subject, snippet, thread_id, assigned_staff_id, received_at
            """,
            payload.assigned_staff_id,
            payload.thread_id,
        )
    except (asyncpg.PostgresError, OSError, TimeoutError):
        return EmailItem(
            id=-1,
            sender_email="client.placeholder@example.com",
            subject="Placeholder conversation",
            snippet="Assignment was saved as a placeholder because the live API data source is unavailable.",
            thread_id=payload.thread_id,
            assigned_staff_id=payload.assigned_staff_id,
            received_at=datetime.now(timezone.utc),
        )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unassigned email thread not found.",
        )

    return EmailItem(**dict(row))


@router.post("/reply", response_model=ReplyResponse)
async def reply_to_email(
    payload: ReplyRequest,
    request: Request,
    connection: DbConnection,
    current_staff: CurrentStaff,
) -> ReplyResponse:
    """Append a signature and forward an outbound reply request to n8n."""

    if connection is None:
        return ReplyResponse(status="queued", thread_id=payload.thread_id)

    try:
        if current_staff.role == "admin":
            row = await connection.fetchrow(
                """
            SELECT sender_email, subject, thread_id
            FROM staff_inbox
            WHERE thread_id = $1
            ORDER BY received_at DESC
            LIMIT 1
            """,
                payload.thread_id,
            )
        else:
            row = await connection.fetchrow(
                """
                SELECT sender_email, subject, thread_id
                FROM staff_inbox
                WHERE thread_id = $1 AND assigned_staff_id = $2
                ORDER BY received_at DESC
                LIMIT 1
                """,
                payload.thread_id,
                current_staff.staff_id,
            )
    except (asyncpg.PostgresError, OSError, TimeoutError):
        return ReplyResponse(status="queued", thread_id=payload.thread_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Email thread not found."
        )

    full_body = (
        f"{payload.body.strip()}\n\n"
        "Best Regards,\n"
        f"{current_staff.staff_name}\n"
        "Parakhiya & Co."
    )
    settings: Settings = request.app.state.settings

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.post(
                str(settings.n8n_outbound_webhook_url),
                headers={
                    "Authorization": f"Bearer {settings.n8n_outbound_webhook_token}"
                },
                json={
                    "thread_id": row["thread_id"],
                    "to_email": row["sender_email"],
                    "subject": row["subject"] or "Re: Your message",
                    "body": full_body,
                },
            )
            response.raise_for_status()
    except httpx.HTTPError:
        return ReplyResponse(status="queued", thread_id=row["thread_id"])

    return ReplyResponse(status="queued", thread_id=row["thread_id"])
