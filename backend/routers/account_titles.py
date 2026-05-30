from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from domain.exceptions import AccountTitleInUseError
from models import AccountTitle
from repositories import account_title_repository as repo
from schemas.account_title import (
    AccountTitleCreate,
    AccountTitleResponse,
    AccountTitleUpdate,
)

router = APIRouter(prefix="/api/account-titles", tags=["account-titles"])


@router.get("", response_model=list[AccountTitleResponse])
def list_account_titles(
    active_only: bool = True,
    db: Session = Depends(get_db),
):
    return repo.find_all(db, active_only=active_only)


@router.get("/{id}", response_model=AccountTitleResponse)
def get_account_title(id: UUID, db: Session = Depends(get_db)):
    account_title = repo.find_by_id(db, id)
    if account_title is None:
        raise HTTPException(status_code=404, detail="勘定科目が見つかりません")
    return account_title


@router.post("", response_model=AccountTitleResponse, status_code=201)
def create_account_title(
    body: AccountTitleCreate,
    db: Session = Depends(get_db),
):
    account_title = AccountTitle(
        name=body.name,
        account_type=body.account_type,
        freee_company_id=body.freee_company_id,
        freee_account_item_id=body.freee_account_item_id,
        freee_tax_code=body.freee_tax_code,
    )
    return repo.save(db, account_title)


@router.put("/{id}", response_model=AccountTitleResponse)
def update_account_title(
    id: UUID,
    body: AccountTitleUpdate,
    db: Session = Depends(get_db),
):
    account_title = repo.find_by_id(db, id)
    if account_title is None:
        raise HTTPException(status_code=404, detail="勘定科目が見つかりません")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(account_title, field, value)

    return repo.save(db, account_title)


@router.delete("/{id}", status_code=204)
def delete_account_title(id: UUID, db: Session = Depends(get_db)):
    account_title = repo.find_by_id(db, id)
    if account_title is None:
        raise HTTPException(status_code=404, detail="勘定科目が見つかりません")

    try:
        repo.deactivate(db, id)
    except AccountTitleInUseError as e:
        raise HTTPException(status_code=400, detail=str(e))
