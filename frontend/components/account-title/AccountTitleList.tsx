"use client"

import { useState } from "react"
import { AccountTitle } from "@/types/account_title"

interface Props {
  accountTitles: AccountTitle[]
  onEdit: (at: AccountTitle) => void
  onDeactivate: (id: string) => Promise<void>
}

export function AccountTitleList({ accountTitles, onEdit, onDeactivate }: Props) {
  const [deactivateTarget, setDeactivateTarget] = useState<AccountTitle | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState<string | null>(null)

  const handleDeactivate = async () => {
    if (!deactivateTarget) return
    setIsDeactivating(true)
    setDeactivateError(null)
    try {
      await onDeactivate(deactivateTarget.id)
      setDeactivateTarget(null)
    } catch (err) {
      setDeactivateError(err instanceof Error ? err.message : "無効化に失敗しました")
    } finally {
      setIsDeactivating(false)
    }
  }

  if (accountTitles.length === 0) {
    return <p className="text-gray-400 text-base text-center py-8">勘定科目がありません</p>
  }

  return (
    <>
      <div className="space-y-2">
        {accountTitles.map((at) => (
          <div
            key={at.id}
            className={`bg-white border rounded-lg p-4 ${!at.is_active ? "opacity-50 border-gray-200" : "border-gray-200"}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-medium text-gray-900">{at.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    at.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {at.is_active ? "有効" : "無効"}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    {at.account_type === "income" ? "売上" : "支出"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  会社ID: {at.freee_company_id} / 科目ID: {at.freee_account_item_id} / 税コード: {at.freee_tax_code}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(at)}
                  className="text-blue-600 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                >
                  編集
                </button>
                {at.is_active && (
                  <button
                    onClick={() => { setDeactivateTarget(at); setDeactivateError(null) }}
                    className="text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    無効化
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Deactivate confirmation modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">勘定科目を無効化</h2>
            <p className="text-base text-gray-600 mb-6">
              この勘定科目を無効化します。請求書から参照されている場合は無効化できません。
            </p>
            {deactivateError && <p className="mb-3 text-red-600 text-base">{deactivateError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDeactivateTarget(null)}
                disabled={isDeactivating}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {isDeactivating ? "処理中..." : "無効化"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
