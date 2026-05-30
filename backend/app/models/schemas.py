from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


Role = Literal["admin", "staff"]


class Staff(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    staff_id: int
    staff_name: str
    staff_email: EmailStr
    role: Role = "staff"


class StaffOption(BaseModel):
    staff_id: int
    staff_name: str
    staff_email: EmailStr


class EmailItem(BaseModel):
    id: int
    sender_email: EmailStr | str
    subject: str | None = None
    snippet: str | None = None
    thread_id: str
    assigned_staff_id: int | None = None
    received_at: datetime


class InboxResponse(BaseModel):
    current_user: Staff
    emails: list[EmailItem]
    staff: list[StaffOption] = Field(default_factory=list)


class AssignEmailRequest(BaseModel):
    thread_id: str = Field(min_length=1, max_length=100)
    assigned_staff_id: int = Field(gt=0)


class ReplyRequest(BaseModel):
    thread_id: str = Field(min_length=1, max_length=100)
    body: str = Field(min_length=1, max_length=20_000)


class ReplyResponse(BaseModel):
    status: Literal["queued"]
    thread_id: str
