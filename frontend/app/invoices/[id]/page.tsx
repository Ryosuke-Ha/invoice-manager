"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices"
import { StatusBadge } from "@/components/invoice/StatusBadge"
import {
  InvoiceStatus,
  STATUS_LABELS,
  VALID_NEXT_STATUSES,
} from "@/types/invoice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

function isOverdue(dueDateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDateStr) < today
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { invoice, isLoading, error, mutate } = useInvoice(id)
  const { updateStatus } = useUpdateInvoiceStatus()
  const { deleteInvoice } = useDeleteInvoice()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  if (isLoading) {
    return (
      <p className="text-gray-400 text-base animate-pulse text-center py-8">
        読み込み中...
      </p>
    )
  }

  if (error || !invoice) {
    return (
      <p className="text-red-600 text-base text-center py-8">
        請求書が見つかりません
      </p>
    )
  }

  const overdue = isOverdue(invoice.due_date)
  const isDraft = invoice.status === "draft"
  const canSyncFreee =
    invoice.status === "paid" && invoice.freee_sync_status === "unsynced"
  const nextStatuses = VALID_NEXT_STATUSES[invoice.status]

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as InvoiceStatus
    setActionError(null)
    try {
      await updateStatus(id, next)
      await mutate()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "ステータス更新に失敗しました")
    }
  }

  const handleSyncFreee = async () => {
    setIsSyncing(true)
    setActionError(null)
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}/sync-freee`, {
        method: "POST",
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      await mutate()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "freee連携に失敗しました")
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setActionError(null)
    try {
      await deleteInvoice(id)
      router.push("/invoices")
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "削除に失敗しました")
      setShowDeleteModal(false)
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/invoices" className="text-blue-600 text-base">
          ← 一覧
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-start justify-between gap-2 mb-4">
          <h1 className="text-xl font-bold text-gray-900 break-all">
            {invoice.title}
          </h1>
          <StatusBadge status={invoice.status} />
        </div>

        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500">金額</dt>
            <dd className="text-lg font-bold text-gray-900">
              ¥{invoice.amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">発行日</dt>
            <dd className="text-base text-gray-800">{invoice.issue_date}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">支払期日</dt>
            <dd className={`text-base font-medium ${overdue ? "text-red-600" : "text-gray-800"}`}>
              {invoice.due_date}
              {overdue && " ⚠️ 期日超過"}
            </dd>
          </div>
          {invoice.paid_date && (
            <div>
              <dt className="text-sm text-gray-500">支払日</dt>
              <dd className="text-base text-gray-800">{invoice.paid_date}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500">freee連携</dt>
            <dd className="text-base text-gray-800">
              {invoice.freee_sync_status === "synced"
                ? `連携済み (Deal ID: ${invoice.freee_deal_id})`
                : "未連携"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">作成日時</dt>
            <dd className="text-sm text-gray-600">
              {new Date(invoice.created_at).toLocaleString("ja-JP")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">更新日時</dt>
            <dd className="text-sm text-gray-600">
              {new Date(invoice.updated_at).toLocaleString("ja-JP")}
            </dd>
          </div>
        </dl>
      </div>

      {actionError && (
        <p className="mt-3 text-red-600 text-base">{actionError}</p>
      )}

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm text-gray-600 mb-1">
            ステータス変更
          </label>
          <select
            onChange={handleStatusChange}
            defaultValue=""
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base bg-white"
          >
            <option value="" disabled>
              変更先を選択...
            </option>
            {nextStatuses.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {/* Edit button (Draft only) */}
        {isDraft && (
          <Link
            href={`/invoices/${id}/edit`}
            className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
          >
            編集
          </Link>
        )}

        {/* freee sync button */}
        {canSyncFreee && (
          <button
            onClick={handleSyncFreee}
            disabled={isSyncing}
            className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {isSyncing ? "連携中..." : "freee連携"}
          </button>
        )}

        {/* Delete button (Draft only) */}
        {isDraft && (
          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full bg-white border border-red-300 text-red-600 px-4 py-3 rounded-lg text-base font-medium hover:bg-red-50 transition-colors"
          >
            削除
          </button>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              請求書を削除しますか？
            </h2>
            <p className="text-base text-gray-600 mb-6">
              「{invoice.title}」を削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
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
    </div>
  )
}
