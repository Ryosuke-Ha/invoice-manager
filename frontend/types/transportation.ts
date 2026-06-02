export interface TransportationExpense {
  id: string
  summary_id: string
  expense_date: string
  amount: number
  description: string
  created_at: string
  updated_at: string
}

export interface TransportationTemplate {
  id: string
  day_of_week: number
  day_of_week_label: string
  amount: number
  description: string
  created_at: string
  updated_at: string
}

export interface MonthlyTransportationSummary {
  id: string | null
  year: number
  month: number
  is_fixed: boolean
  expenses: TransportationExpense[]
  total_amount: number
  created_at: string | null
  updated_at: string | null
}
