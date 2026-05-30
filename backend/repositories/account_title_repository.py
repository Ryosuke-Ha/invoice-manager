from uuid import UUID

from sqlalchemy.orm import Session

from domain.exceptions import AccountTitleInUseError
from models import AccountTitle, Invoice


def find_all(db: Session, active_only: bool = True) -> list:
    query = db.query(AccountTitle)
    if active_only:
        query = query.filter(AccountTitle.is_active.is_(True))
    return query.all()


def find_by_id(db: Session, id: UUID):
    return db.query(AccountTitle).filter(AccountTitle.id == id).first()


def save(db: Session, account_title: AccountTitle) -> AccountTitle:
    db.add(account_title)
    db.commit()
    db.refresh(account_title)
    return account_title


def deactivate(db: Session, id: UUID) -> AccountTitle:
    account_title = find_by_id(db, id)
    if account_title is None:
        return None

    in_use = (
        db.query(Invoice)
        .filter(Invoice.account_title_id == id)
        .first()
    )
    if in_use:
        raise AccountTitleInUseError(
            f"勘定科目 {id} は請求書から参照されているため削除できません"
        )

    account_title.is_active = False
    db.commit()
    db.refresh(account_title)
    return account_title
