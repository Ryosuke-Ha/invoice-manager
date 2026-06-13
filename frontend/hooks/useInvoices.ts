"use client"

import useSWR, { useSWRConfig } from "swr"
import { Invoice, InvoiceStatus } from "@/types/invoice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const fetcher = (url: string): Promise<Invoice[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Invoice[]>
  })

const fetcherOne = (url: string): Promise<Invoice> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<Invoice>
  })

export function useInvoices() {
  const { data, error, isLoading, mutate } = useSWR<Invoice[]>(
    `${API_URL}/api/invoices`,
    fetcher
  )
  return { invoices: data ?? [], error, isLoading, mutate }
}

export function useInvoice(id: string) {
  const { data, error, isLoading, mutate } = useSWR<Invoice>(
    `${API_URL}/api/invoices/${id}`,
    fetcherOne
  )
  return { invoice: data, error, isLoading, mutate }
}

export function useUpdateInvoiceStatus() {
  const { mutate } = useSWRConfig()

  const updateStatus = async (id: string, status: InvoiceStatus): Promise<Invoice> => {
    const res = await fetch(`${API_URL}/api/invoices/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    const updated = await res.json() as Invoice

    // Optimistic: update detail cache immediately, revalidate list
    await mutate(`${API_URL}/api/invoices/${id}`, updated, { revalidate: false })
    await mutate(
      (key: unknown) => typeof key === "string" && key.startsWith(`${API_URL}/api/invoices`) && !key.includes(id)
    )
    return updated
  }

  return { updateStatus }
}

export function useDeleteInvoice() {
  const { mutate } = useSWRConfig()

  const deleteInvoice = async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/invoices/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }

    // Revalidate list caches
    await mutate(
      (key: unknown) => typeof key === "string" && key.startsWith(`${API_URL}/api/invoices`) && !key.includes(id)
    )
  }

  return { deleteInvoice }
}
