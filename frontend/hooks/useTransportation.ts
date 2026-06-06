"use client"

import useSWR, { useSWRConfig } from "swr"
import { MonthlyTransportationSummary, TransportationTemplate } from "@/types/transportation"
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

const TEMPLATES_KEY = `${API_URL}/api/transportation/templates`

const templatesFetcher = (url: string): Promise<TransportationTemplate[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<TransportationTemplate[]>
  })

export function useTransportationTemplates() {
  const { data, error, isLoading, mutate } = useSWR<TransportationTemplate[]>(
    TEMPLATES_KEY,
    templatesFetcher
  )
  return { templates: data ?? [], error, isLoading, mutate }
}

export function useCreateTransportationTemplate() {
  const { mutate } = useSWRConfig()

  const createTemplate = async (values: {
    day_of_week: number
    amount: number
    description: string
  }): Promise<TransportationTemplate> => {
    const res = await fetch(`${API_URL}/api/transportation/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const created = await res.json() as TransportationTemplate
    await mutate(TEMPLATES_KEY)
    return created
  }

  return { createTemplate }
}

export function useUpdateTransportationTemplate() {
  const { mutate } = useSWRConfig()

  const updateTemplate = async (
    id: string,
    values: { day_of_week?: number; amount?: number; description?: string }
  ): Promise<TransportationTemplate> => {
    const res = await fetch(`${API_URL}/api/transportation/templates/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const updated = await res.json() as TransportationTemplate
    await mutate(TEMPLATES_KEY)
    return updated
  }

  return { updateTemplate }
}

export function useDeleteTransportationTemplate() {
  const { mutate } = useSWRConfig()

  const deleteTemplate = async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/transportation/templates/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    await mutate(TEMPLATES_KEY)
  }

  return { deleteTemplate }
}

interface GenerateFromTemplateResult {
  generated: number
  summary: MonthlyTransportationSummary
}

export function useGenerateFromTemplate(year: number, month: number) {
  const { mutate } = useSWRConfig()

  const generateFromTemplate = async (): Promise<MonthlyTransportationSummary> => {
    const res = await fetch(
      `${API_URL}/api/transportation/${year}/${month}/generate-from-template`,
      { method: "POST" }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const result = await res.json() as GenerateFromTemplateResult
    await mutate(summaryKey(year, month), result.summary, { revalidate: false })
    return result.summary
  }

  return { generateFromTemplate }
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
