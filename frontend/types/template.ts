export interface InvoiceTemplate {
  id: string
  title: string
  amount: number
  account_title_id: string | null
  auto_generate: boolean
  created_at: string
  updated_at: string
}
