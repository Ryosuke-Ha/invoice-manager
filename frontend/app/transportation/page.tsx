"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  useTransportation,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
  useFixTransportation,
  useMergeToInvoice,
} from "@/hooks/useTransportation"
import { useAccountTitles } from "@/hooks/useAccountTitles"
import { ExpenseTable } from "@/components/transportation/ExpenseTable"
import { Button } from "@/components/ui/Button"

const now = new Date()
const DEFAULT_YEAR = now.getFullYear()
const DEFAULT_MONTH = now.getMonth() + 1

export default function TransportationPage() {
  const router = useRouter()
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [month, setMonth] = useState(DEFAULT_MONTH)

  const { summary, isLoading, error, mutate } = useTransportation(year, month)
  const { addExpense } = useAddExpense(year, month)
  const { updateExpense } = useUpdateExpense(year, month)
  const { deleteExpense } = useDeleteExpense(year, month)
  const { fixTransportation } = useFixTransportation(year, month)
  const { mergeToInvoice } = useMergeToInvoice(year, month)
  const { accountTitles } = useAccountTitles(true)

  const [showFixModal, setShowFixModal] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [fixError, setFixError] = useState<string | null>(null)

  const [showMergeModal, setShowMergeModal] = useState(false)
  const [mergeAccountTitleId, setMergeAccountTitleId] = useState("")
  const [isMerging, setIsMerging] = useState(false)
  const [mergeError, setMergeError] = useState<string | null>(null)

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1) }
    else setMonth((m) => m + 1)
  }

  const handleAddExpense = async (values: {
    expense_date: string
    amount: number
    description: string
  }) => {
    await addExpense(values)
  }

  const handleUpdateExpense = async (
    expenseId: string,
    values: { expense_date: string; amount: number; description: string }
  ) => {
    await updateExpense(expenseId, values)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!summary) return
    await deleteExpense(expenseId, summary)
  }

  const handleFix = async () => {
    setIsFixing(true)
    setFixError(null)
    try {
      await fixTransportation()
      setShowFixModal(false)
    } catch (err) {
      setFixError(err instanceof Error ? err.message : "確定に失敗しました")
    } finally {
      setIsFixing(false)
    }
  }

  const handleMerge = async () => {
    setIsMerging(true)
    setMergeError(null)
    try {
      const invoice = await mergeToInvoice(mergeAccountTitleId || null)
      router.push(`/invoices/${invoice.id}`)
    } catch (err) {
      setMergeError(err instanceof Error ? err.message : "請求書反映に失敗しました")
      setIsMerging(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">月次交通費</h1>
        {/* Year/month navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="前月"
          >
            ◀
          </button>
          <span className="text-base font-semibold text-gray-900 min-w-[7rem] text-center">
            {year}年{month}月
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="翌月"
          >
            ▶
          </button>
        </div>
      </div>

      {isLoading && (
        <p className="text-gray-400 text-base animate-pulse text-center py-8">
          読み込み中...
        </p>
      )}

      {error && (
        <p className="text-red-600 text-base text-center py-8">
          データの取得に失敗しました
        </p>
      )}

      {!isLoading && !error && (
        <>
          {/* Expense table */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
            <h2 className="text-base font-semibold text-gray-800 mb-3">
              交通費一覧
            </h2>
            {summary ? (
              <ExpenseTable
                summary={summary}
                onAdd={handleAddExpense}
                onUpdate={handleUpdateExpense}
                onDelete={handleDeleteExpense}
              />
            ) : (
              <p className="text-gray-400 text-base text-center py-4">
                交通費がありません
              </p>
            )}
          </div>

          {/* Fix / merge area */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {summary?.is_fixed ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded text-sm font-medium">
                    確定済み
                  </span>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => { setShowMergeModal(true); setMergeError(null) }}
                  className="w-full"
                >
                  請求書に反映
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                onClick={() => { setShowFixModal(true); setFixError(null) }}
                disabled={!summary || summary.expenses.length === 0}
                className="w-full"
              >
                月次確定
              </Button>
            )}
          </div>
        </>
      )}

      {/* Fix confirmation modal */}
      {showFixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">月次確定</h2>
            <p className="text-base text-gray-600 mb-6">
              確定すると編集できなくなります。よろしいですか？
            </p>
            {fixError && <p className="mb-3 text-red-600 text-base">{fixError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowFixModal(false)}
                disabled={isFixing}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleFix}
                disabled={isFixing}
                className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {isFixing ? "確定中..." : "確定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge to invoice modal */}
      {showMergeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-2">請求書に反映</h2>
            <p className="text-sm text-gray-600 mb-4">
              勘定科目を選択してください（任意）
            </p>
            <select
              value={mergeAccountTitleId}
              onChange={(e) => setMergeAccountTitleId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-3 text-base bg-white mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontSize: "16px" }}
            >
              <option value="">選択しない</option>
              {accountTitles.map((at) => (
                <option key={at.id} value={at.id}>
                  {at.name}
                </option>
              ))}
            </select>
            {mergeError && <p className="mb-3 text-red-600 text-base">{mergeError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setShowMergeModal(false)}
                disabled={isMerging}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleMerge}
                disabled={isMerging}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {isMerging ? "反映中..." : "反映"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
