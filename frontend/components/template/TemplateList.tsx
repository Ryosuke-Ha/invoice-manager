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
      <div className="space-y-2">
        {templates.map((tmpl) => (
          <div key={tmpl.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-gray-900 break-all">{tmpl.title}</p>
                <p className="text-base font-semibold text-gray-800 mt-1">
                  ¥{tmpl.amount.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => onEdit(tmpl)}
                  className="text-blue-600 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
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
            </div>

            {/* Auto generate toggle */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-600">自動生成</span>
              <button
                type="button"
                role="switch"
                aria-checked={tmpl.auto_generate}
                onClick={() => handleToggle(tmpl)}
                disabled={togglingId === tmpl.id}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  tmpl.auto_generate ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  tmpl.auto_generate ? "translate-x-6" : "translate-x-1"
                }`} />
              </button>
            </div>
          </div>
        ))}
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
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-red-700 disabled:opacity-50"
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
