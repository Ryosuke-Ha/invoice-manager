export interface AccountTitle {
  id: string
  name: string
  account_type: "income" | "expense"
  freee_company_id: number
  freee_account_item_id: number
  freee_tax_code: number
  is_active: boolean
  created_at: string
  updated_at: string
}
