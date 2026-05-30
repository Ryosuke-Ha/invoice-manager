export type InvoiceStatus =
  | "draft"
  | "sent"
  | "reminding"
  | "overdue"
  | "paid"
  | "synced_to_freee"
  | "completed"

export type FreeeSyncStatus = "unsynced" | "synced"

export interface Invoice {
  id: string
  title: string
  amount: number
  due_date: string
  issue_date: string
  paid_date: string | null
  status: InvoiceStatus
  freee_sync_status: FreeeSyncStatus
  freee_deal_id: number | null
  account_title_id: string | null
  template_id: string | null
  created_at: string
  updated_at: string
}

export const VALID_NEXT_STATUSES: Record<InvoiceStatus, InvoiceStatus[]> = {
  draft: ["sent"],
  sent: ["reminding", "overdue"],
  reminding: ["overdue", "paid"],
  overdue: ["paid"],
  paid: ["synced_to_freee"],
  synced_to_freee: ["completed"],
  completed: [],
}

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "下書き",
  sent: "送付済み",
  reminding: "リマインド中",
  overdue: "期日超過",
  paid: "支払済み",
  synced_to_freee: "freee連携済み",
  completed: "対応済み",
}
