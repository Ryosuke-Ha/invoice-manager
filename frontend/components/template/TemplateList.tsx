"use client"

import { useState } from "react"
import { InvoiceTemplate } from "@/types/template"

interface Props {
  templates: InvoiceTemplate[]
  onEdit: (tmpl: InvoiceTemplate) => void
  onDelete: (id: string) => Promise<void>
  onToggleAutoGenerate: (tmpl: InvoiceTemplate) => Promise<void>
}

export function TemplateList({ templates, onEdit, onDelete, onToggleAutoGenerate }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<InvoiceTemplate | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "削除に失敗しました")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleToggle = async (tmpl: InvoiceTemplate) => {
    setTogglingId(tmpl.id)
    try {
      await onToggleAutoGenerate(tmpl)
    } finally {
      setTogglingId(null)
    }
  }

  if (templates.length === 0) {
    return <p className="text-gray-400 text-base text-center py-8">テンプレートがありません</p>
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  タイトル
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                  金額
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                  勘定科目
                </th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-500">
                  自動生成
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {templates.map((tmpl) => (
                <tr
                  key={tmpl.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {tmpl.title}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                    ¥{tmpl.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-sm">
                    {tmpl.account_title_id ? "設定あり" : "なし"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={tmpl.auto_generate}
                      onClick={() => handleToggle(tmpl)}
                      disabled={togglingId === tmpl.id}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 ${
                        tmpl.auto_generate ? "bg-primary-500" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        tmpl.auto_generate ? "translate-x-6" : "translate-x-1"
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => onEdit(tmpl)}
                        className="text-primary-600 text-sm px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => { setDeleteTarget(tmpl); setDeleteError(null) }}
                        className="text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">テンプレートを削除</h2>
            <p className="text-base text-gray-600 mb-6">
              「{deleteTarget.title}」を削除します。この操作は取り消せません。
            </p>
            {deleteError && <p className="mb-3 text-red-600 text-base">{deleteError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md text-base font-medium hover:bg-gray-50 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-md text-base font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? "削除中..." : "削除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
