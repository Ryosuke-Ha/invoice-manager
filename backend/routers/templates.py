from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import InvoiceTemplate
from repositories import template_repository as repo
from schemas.template import TemplateCreate, TemplateResponse, TemplateUpdate

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=list[TemplateResponse])
def list_templates(db: Session = Depends(get_db)):
    return repo.find_all(db)


@router.get("/{id}", response_model=TemplateResponse)
def get_template(id: UUID, db: Session = Depends(get_db)):
    template = repo.find_by_id(db, id)
    if template is None:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")
    return template


@router.post("", response_model=TemplateResponse, status_code=201)
def create_template(body: TemplateCreate, db: Session = Depends(get_db)):
    template = InvoiceTemplate(
        title=body.title,
        amount=body.amount,
        account_title_id=body.account_title_id,
        auto_generate=body.auto_generate,
    )
    return repo.save(db, template)


@router.put("/{id}", response_model=TemplateResponse)
def update_template(
    id: UUID,
    body: TemplateUpdate,
    db: Session = Depends(get_db),
):
    template = repo.find_by_id(db, id)
    if template is None:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(template, field, value)

    return repo.save(db, template)


@router.delete("/{id}", status_code=204)
def delete_template(id: UUID, db: Session = Depends(get_db)):
    template = repo.find_by_id(db, id)
    if template is None:
        raise HTTPException(status_code=404, detail="テンプレートが見つかりません")
    repo.remove(db, id)
