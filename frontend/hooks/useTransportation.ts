"use client"

import useSWR, { useSWRConfig } from "swr"
import { MonthlyTransportationSummary } from "@/types/transportation"
import { Invoice } from "@/types/invoice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const fetcher = (url: string): Promise<MonthlyTransportationSummary> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<MonthlyTransportationSummary>
  })

function summaryKey(year: number, month: number) {
  return `${API_URL}/api/transportation/${year}/${month}`
}

export function useTransportation(year: number, month: number) {
  const { data, error, isLoading, mutate } = useSWR<MonthlyTransportationSummary>(
    summaryKey(year, month),
    fetcher
  )
  return { summary: data, error, isLoading, mutate }
}

export function useAddExpense(year: number, month: number) {
  const { mutate } = useSWRConfig()

  const addExpense = async (values: {
    expense_date: string
    amount: number
    description: string
  }): Promise<MonthlyTransportationSummary> => {
    const res = await fetch(
      `${API_URL}/api/transportation/${year}/${month}/expenses`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const updated = await res.json() as MonthlyTransportationSummary
    await mutate(summaryKey(year, month), updated, { revalidate: false })
    return updated
  }

  return { addExpense }
}

export function useUpdateExpense(year: number, month: number) {
  const { mutate } = useSWRConfig()

  const updateExpense = async (
    expenseId: string,
    values: { expense_date?: string; amount?: number; description?: string }
  ): Promise<MonthlyTransportationSummary> => {
    const res = await fetch(
      `${API_URL}/api/transportation/${year}/${month}/expenses/${expenseId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const updated = await res.json() as MonthlyTransportationSummary
    await mutate(summaryKey(year, month), updated, { revalidate: false })
    return updated
  }

  return { updateExpense }
}

export function useDeleteExpense(year: number, month: number) {
  const { mutate } = useSWRConfig()

  const deleteExpense = async (
    expenseId: string,
    currentSummary: MonthlyTransportationSummary
  ): Promise<void> => {
    // Optimistic update
    const optimistic: MonthlyTransportationSummary = {
      ...currentSummary,
      expenses: currentSummary.expenses.filter((e) => e.id !== expenseId),
      total_amount: currentSummary.expenses
        .filter((e) => e.id !== expenseId)
        .reduce((sum, e) => sum + e.amount, 0),
    }
    await mutate(
      summaryKey(year, month),
      async () => {
        const res = await fetch(
          `${API_URL}/api/transportation/${year}/${month}/expenses/${expenseId}`,
          { method: "DELETE" }
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }
        return currentSummary
      },
      { optimisticData: optimistic, rollbackOnError: true }
    )
  }

  return { deleteExpense }
}

export function useFixTransportation(year: number, month: number) {
  const { mutate } = useSWRConfig()

  const fixTransportation = async (): Promise<MonthlyTransportationSummary> => {
    const res = await fetch(
      `${API_URL}/api/transportation/${year}/${month}/fix`,
      { method: "POST" }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const updated = await res.json() as MonthlyTransportationSummary
    await mutate(summaryKey(year, month), updated, { revalidate: false })
    return updated
  }

  return { fixTransportation }
}

export function useMergeToInvoice(year: number, month: number) {
  const mergeToInvoice = async (accountTitleId: string | null): Promise<Invoice> => {
    const res = await fetch(
      `${API_URL}/api/transportation/${year}/${month}/merge-to-invoice`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account_title_id: accountTitleId }),
      }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    return res.json() as Promise<Invoice>
  }

  return { mergeToInvoice }
}
