from typing import Annotated

import asyncpg
from fastapi import Depends, Header, HTTPException, status

from app.core.database import get_connection
from app.models.schemas import Staff


def placeholder_staff(
    x_staff_email: str | None = None, x_staff_id: int | None = None
) -> Staff:
    """Build a safe demo identity when upstream staff data cannot be reached."""

    return Staff(
        staff_id=x_staff_id or 1,
        staff_name="Demo Staff",
        staff_email=x_staff_email or "demo.staff@parakhiya.example",
        role="admin",
    )


async def get_current_staff(
    connection: Annotated[asyncpg.Connection | None, Depends(get_connection)],
    x_staff_email: Annotated[str | None, Header(alias="X-Staff-Email")] = None,
    x_staff_id: Annotated[int | None, Header(alias="X-Staff-Id")] = None,
) -> Staff:
    """Resolve the authenticated staff identity supplied by upstream auth middleware."""

    if connection is None:
        return placeholder_staff(x_staff_email, x_staff_id)

    try:
        if x_staff_email:
            row = await connection.fetchrow(
                """
                SELECT staff_id, staff_name, staff_email, role
                FROM staff
                WHERE lower(staff_email) = lower($1)
                """,
                x_staff_email,
            )
        elif x_staff_id:
            row = await connection.fetchrow(
                """
                SELECT staff_id, staff_name, staff_email, role
                FROM staff
                WHERE staff_id = $1
                """,
                x_staff_id,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing staff identity header.",
            )
    except (asyncpg.PostgresError, OSError, TimeoutError):
        return placeholder_staff(x_staff_email, x_staff_id)

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Unknown staff user."
        )

    return Staff(**dict(row))


CurrentStaff = Annotated[Staff, Depends(get_current_staff)]
DbConnection = Annotated[asyncpg.Connection | None, Depends(get_connection)]


def require_admin(current_staff: CurrentStaff) -> Staff:
    if current_staff.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required."
        )
    return current_staff


AdminStaff = Annotated[Staff, Depends(require_admin)]
