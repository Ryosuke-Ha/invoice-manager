"use client"

import useSWR from "swr"
import { InvoiceTemplate } from "@/types/template"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const fetcher = (url: string): Promise<InvoiceTemplate[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<InvoiceTemplate[]>
  })

export function useTemplates() {
  const { data, error, isLoading, mutate } = useSWR<InvoiceTemplate[]>(
    `${API_URL}/api/templates`,
    fetcher
  )
  return { templates: data ?? [], error, isLoading, mutate }
}
