"use client"

import { useState } from "react"
import { useSWRConfig } from "swr"
import { useAccountTitles } from "@/hooks/useAccountTitles"
import { AccountTitleList } from "@/components/account-title/AccountTitleList"
import { AccountTitleForm, AccountTitleFormValues } from "@/components/account-title/AccountTitleForm"
import { AccountTitle } from "@/types/account_title"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function AccountTitlesPage() {
  const [showInactive, setShowInactive] = useState(false)
  const { accountTitles, isLoading, error, mutate } = useAccountTitles(showInactive ? false : undefined)
  const { mutate: globalMutate } = useSWRConfig()

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null)
  const [editTarget, setEditTarget] = useState<AccountTitle | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openAdd = () => { setEditTarget(null); setModalMode("add") }
  const openEdit = (at: AccountTitle) => { setEditTarget(at); setModalMode("edit") }
  const closeModal = () => { setModalMode(null); setEditTarget(null) }

  const handleSubmit = async (values: AccountTitleFormValues) => {
    setIsSubmitting(true)
    try {
      const body = {
        name: values.name,
        account_type: values.account_type,
        freee_company_id: Number(values.freee_company_id),
        freee_account_item_id: Number(values.freee_account_item_id),
        freee_tax_code: Number(values.freee_tax_code),
      }

      if (modalMode === "edit" && editTarget) {
        const res = await fetch(`${API_URL}/api/account-titles/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }
      } else {
        const res = await fetch(`${API_URL}/api/account-titles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }
      }

      await mutate()
      // Revalidate active-only cache used in forms
      await globalMutate(
        (key: unknown) =>
          typeof key === "string" && key.includes("/api/account-titles")
      )
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    const res = await fetch(`${API_URL}/api/account-titles/${id}`, {
      method: "DELETE",
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    await mutate()
    await globalMutate(
      (key: unknown) =>
        typeof key === "string" && key.includes("/api/account-titles")
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">勘定科目管理</h1>
        <button
          onClick={openAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
        >
          新規追加
        </button>
      </div>

      {/* Show inactive toggle */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mb-4">
        <span className="text-base text-gray-700">無効化済みを表示</span>
        <button
          type="button"
          role="switch"
          aria-checked={showInactive}
          onClick={() => setShowInactive((v) => !v)}
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            showInactive ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            showInactive ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
      </div>

      {isLoading && (
        <p className="text-gray-400 text-base animate-pulse text-center py-8">読み込み中...</p>
      )}
      {error && (
        <p className="text-red-600 text-base text-center py-8">データの取得に失敗しました</p>
      )}
      {!isLoading && !error && (
        <AccountTitleList
          accountTitles={accountTitles}
          onEdit={openEdit}
          onDeactivate={handleDeactivate}
        />
      )}

      {/* Add/Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm my-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modalMode === "add" ? "勘定科目を追加" : "勘定科目を編集"}
            </h2>
            <AccountTitleForm
              initial={editTarget ?? undefined}
              onSubmit={handleSubmit}
              submitLabel={modalMode === "add" ? "追加" : "更新"}
              isSubmitting={isSubmitting}
            />
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="mt-3 w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
