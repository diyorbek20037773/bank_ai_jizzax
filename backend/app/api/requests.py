from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.request import UserRequest
from app.models.asset import Asset
from app.schemas.request import RequestCreate, RequestResponse, RequestAction
from app.core.dependencies import require_auth, require_admin

router = APIRouter(prefix="/api/requests", tags=["Requests"])


def _to_response(req: UserRequest) -> RequestResponse:
    return RequestResponse(
        id=req.id,
        user_id=req.user_id,
        user_name=req.user.full_name if req.user else None,
        asset_id=req.asset_id,
        asset_name=req.asset.name if req.asset else None,
        asset_inventory_number=req.asset.inventory_number if req.asset else None,
        request_type=req.request_type,
        requested_status=req.requested_status,
        reason=req.reason,
        photo_path=req.photo_path,
        status=req.status,
        admin_response=req.admin_response,
        responder_name=req.responder.full_name if req.responder else None,
        responded_at=req.responded_at,
        created_at=req.created_at,
    )


@router.post("/", response_model=RequestResponse)
def create_request(
    data: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    req = UserRequest(
        user_id=current_user.id,
        asset_id=data.asset_id,
        request_type=data.request_type,
        requested_status=data.requested_status,
        reason=data.reason,
        photo_path=data.photo_path,
        status="PENDING",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return _to_response(req)


@router.get("/my", response_model=list[RequestResponse])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_auth),
):
    reqs = (
        db.query(UserRequest)
        .filter(UserRequest.user_id == current_user.id)
        .order_by(UserRequest.created_at.desc())
        .all()
    )
    return [_to_response(r) for r in reqs]


@router.get("/", response_model=list[RequestResponse])
def all_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    reqs = (
        db.query(UserRequest)
        .order_by(UserRequest.created_at.desc())
        .all()
    )
    return [_to_response(r) for r in reqs]


@router.get("/pending-count")
def pending_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    count = db.query(UserRequest).filter(UserRequest.status == "PENDING").count()
    return {"count": count}


@router.patch("/{request_id}", response_model=RequestResponse)
def respond_to_request(
    request_id: int,
    action: RequestAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    req = db.query(UserRequest).filter(UserRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="So'rov topilmadi")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Bu so'rov allaqachon ko'rib chiqilgan")

    req.status = action.status
    req.admin_response = action.admin_response
    req.responded_by = current_user.id
    req.responded_at = datetime.utcnow()

    # If approved and it's a status change request, apply it
    if action.status == "APPROVED" and req.request_type in ("STATUS_CHANGE", "REPORT_LOST") and req.asset_id:
        asset = db.query(Asset).filter(Asset.id == req.asset_id).first()
        if asset:
            if req.request_type == "REPORT_LOST":
                asset.status = "LOST"
            elif req.requested_status:
                asset.status = req.requested_status

    db.commit()
    db.refresh(req)
    return _to_response(req)
