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
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  勘定科目名
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  区分
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">
                  freee科目ID
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  状態
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {accountTitles.map((at) => (
                <tr
                  key={at.id}
                  className={`border-b border-gray-100 last:border-0 transition-colors hover:bg-gray-50 ${
                    !at.is_active ? "text-gray-400" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium">
                    {at.name}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm bg-blue-50 text-blue-600">
                      {at.account_type === "income" ? "売上" : "支出"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {at.freee_account_item_id}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-medium ${
                      at.is_active
                        ? "bg-primary-100 text-primary-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {at.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(at)}
                        className="text-primary-600 text-sm px-2 py-1 rounded hover:bg-primary-50 transition-colors"
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md text-base font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeactivate}
                disabled={isDeactivating}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md text-base font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
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
