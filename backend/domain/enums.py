from enum import Enum  # noqa: F401


# ここにアプリ固有のEnumを追加
# 例:
# class ItemStatus(str, Enum):
#     ACTIVE = "active"
#     COMPLETED = "completed"
#     ARCHIVED = "archived"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"                        # 下書き
    SENT = "sent"                          # 送付済み
    REMINDING = "reminding"                # リマインド中
    OVERDUE = "overdue"                    # 期日超過
    PAID = "paid"                          # 支払済み
    SYNCED_TO_FREEE = "synced_to_freee"    # freee連携済み
    COMPLETED = "completed"                # 対応済み


class FreeeSyncStatus(str, Enum):
    UNSYNCED = "unsynced"  # 未連携
    SYNCED = "synced"      # 連携済み
