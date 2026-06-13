"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from "@/hooks/useInvoices"
import { StatusBadge } from "@/components/invoice/StatusBadge"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { PageHeader } from "@/components/ui/PageHeader"
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
  const [editingDueDate, setEditingDueDate] = useState(false)
  const [dueDateInput, setDueDateInput] = useState("")
  const [isSavingDueDate, setIsSavingDueDate] = useState(false)

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
  const canEditDueDate =
    invoice.status !== "synced_to_freee" && invoice.status !== "completed"
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

  const handleStartEditDueDate = () => {
    setDueDateInput(invoice.due_date)
    setEditingDueDate(true)
    setActionError(null)
  }

  const handleSaveDueDate = async () => {
    if (!dueDateInput) return
    setIsSavingDueDate(true)
    setActionError(null)
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}/due-date`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ due_date: dueDateInput }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      await mutate()
      setEditingDueDate(false)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "支払期日の更新に失敗しました")
    } finally {
      setIsSavingDueDate(false)
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
      <div className="mb-4">
        <Link href="/invoices" className="text-primary-600 text-base hover:text-primary-700">
          ← 一覧
        </Link>
      </div>

      <PageHeader
        title={invoice.title}
        action={<StatusBadge status={invoice.status} />}
      />

      <Card className="mb-4">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">金額</dt>
            <dd className="text-xl font-bold text-gray-900">
              ¥{invoice.amount.toLocaleString()}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">発行日</dt>
            <dd className="text-base text-gray-800">{invoice.issue_date}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">支払期日</dt>
            <dd className="text-base">
              {editingDueDate ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dueDateInput}
                    min={invoice.issue_date}
                    onChange={(e) => setDueDateInput(e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ fontSize: "16px" }}
                  />
                  <button
                    onClick={handleSaveDueDate}
                    disabled={isSavingDueDate}
                    className="text-sm text-white bg-blue-600 px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSavingDueDate ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => setEditingDueDate(false)}
                    disabled={isSavingDueDate}
                    className="text-sm text-gray-600 px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <span className={`font-medium ${overdue ? "text-red-600" : "text-gray-800"}`}>
                  {invoice.due_date}
                  {overdue && " ⚠ 期日超過"}
                  {canEditDueDate && (
                    <button
                      onClick={handleStartEditDueDate}
                      className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      変更
                    </button>
                  )}
                </span>
              )}
            </dd>
          </div>
          {invoice.paid_date && (
            <div>
              <dt className="text-sm text-gray-500 mb-0.5">支払日</dt>
              <dd className="text-base text-gray-800">{invoice.paid_date}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">freee連携</dt>
            <dd className="text-base text-gray-800">
              {invoice.freee_sync_status === "synced"
                ? `連携済み (Deal ID: ${invoice.freee_deal_id})`
                : "未連携"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">作成日時</dt>
            <dd className="text-sm text-gray-600">
              {new Date(invoice.created_at).toLocaleString("ja-JP")}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500 mb-0.5">更新日時</dt>
            <dd className="text-sm text-gray-600">
              {new Date(invoice.updated_at).toLocaleString("ja-JP")}
            </dd>
          </div>
        </dl>
      </Card>

      {actionError && (
        <p className="mb-3 text-red-600 text-base">{actionError}</p>
      )}

      {/* Status change */}
      {nextStatuses.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1">
            ステータス変更
          </label>
          <select
            onChange={handleStatusChange}
            defaultValue=""
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            style={{ fontSize: "16px" }}
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

      <div className="flex flex-col gap-3">
        {isDraft && (
          <Link href={`/invoices/${id}/edit`}>
            <Button variant="primary" className="w-full">
              編集
            </Button>
          </Link>
        )}
        {canSyncFreee && (
          <Button
            variant="secondary"
            onClick={handleSyncFreee}
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? "連携中..." : "freee連携"}
          </Button>
        )}
        {isDraft && (
          <Button
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
            className="w-full"
          >
            削除
          </Button>
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
              <Button
                variant="secondary"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                キャンセル
              </Button>
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
    </div>
  )
}
