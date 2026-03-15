from datetime import datetime
from pydantic import BaseModel


class RequestCreate(BaseModel):
    asset_id: int | None = None
    request_type: str  # STATUS_CHANGE, REPORT_LOST, REPORT_DAMAGE, OTHER
    requested_status: str | None = None
    reason: str
    photo_path: str | None = None


class RequestResponse(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    asset_id: int | None = None
    asset_name: str | None = None
    asset_inventory_number: str | None = None
    request_type: str
    requested_status: str | None = None
    reason: str
    photo_path: str | None = None
    status: str
    admin_response: str | None = None
    responder_name: str | None = None
    responded_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class RequestAction(BaseModel):
    status: str  # APPROVED or REJECTED
    admin_response: str | None = None
