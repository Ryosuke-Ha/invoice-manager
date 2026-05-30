"use client"

import useSWR from "swr"
import { AccountTitle } from "@/types/account_title"

const API_URL = process.env.NEXT_PUBLIC_API_URL

const fetcher = (url: string): Promise<AccountTitle[]> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res.json() as Promise<AccountTitle[]>
  })

export function useAccountTitles(activeOnly?: boolean) {
  const url = activeOnly
    ? `${API_URL}/api/account-titles?active_only=true`
    : `${API_URL}/api/account-titles`
  const { data, error, isLoading } = useSWR<AccountTitle[]>(url, fetcher)
  return { accountTitles: data ?? [], error, isLoading }
}
