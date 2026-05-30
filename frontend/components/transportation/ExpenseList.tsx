"use client"

import { useState } from "react"
import { TransportationExpense, MonthlyTransportationSummary } from "@/types/transportation"
import { ExpenseForm, ExpenseFormValues } from "./ExpenseForm"

interface Props {
  summary: MonthlyTransportationSummary
  onUpdate: (expenseId: string, values: { expense_date: string; amount: number; description: string }) => Promise<void>
  onDelete: (expenseId: string) => Promise<void>
}

interface EditState {
  id: string
  isSubmitting: boolean
}

export function ExpenseList({ summary, onUpdate, onDelete }: Props) {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleUpdate = async (expense: TransportationExpense, values: ExpenseFormValues) => {
    setEditState({ id: expense.id, isSubmitting: true })
    try {
      await onUpdate(expense.id, {
        expense_date: values.expense_date,
        amount: Number(values.amount),
        description: values.description,
      })
      setEditState(null)
    } catch {
      setEditState({ id: expense.id, isSubmitting: false })
      throw new Error("更新に失敗しました")
    }
  }

  const handleDelete = async (expenseId: string) => {
    setDeletingId(expenseId)
    try {
      await onDelete(expenseId)
    } finally {
      setDeletingId(null)
    }
  }

  if (summary.expenses.length === 0) {
    return (
      <div>
        <p className="text-gray-400 text-base text-center py-4">交通費がありません</p>
        <div className="border-t border-gray-200 pt-3 text-right">
          <span className="text-sm text-gray-500">合計: </span>
          <span className="text-base font-bold text-gray-900">¥0</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2">
        {summary.expenses.map((expense) => {
          const isEditing = editState?.id === expense.id

          if (isEditing) {
            return (
              <div key={expense.id} className="bg-blue-50 rounded-lg p-3">
                <ExpenseForm
                  initial={{
                    expense_date: expense.expense_date,
                    amount: String(expense.amount),
                    description: expense.description,
                  }}
                  onSubmit={(values) => handleUpdate(expense, values)}
                  submitLabel="更新"
                  isSubmitting={editState.isSubmitting}
                  onCancel={() => setEditState(null)}
                />
              </div>
            )
          }

          return (
            <div
              key={expense.id}
              className="flex items-start justify-between gap-2 bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500">{expense.expense_date}</p>
                <p className="text-base text-gray-900 break-all">{expense.description}</p>
                <p className="text-base font-semibold text-gray-800">
                  ¥{expense.amount.toLocaleString()}
                </p>
              </div>
              {!summary.is_fixed && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => setEditState({ id: expense.id, isSubmitting: false })}
                    className="text-blue-600 text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    disabled={deletingId === expense.id}
                    className="text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    {deletingId === expense.id ? "削除中..." : "削除"}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-gray-200 pt-3 mt-3 flex justify-between items-center">
        <span className="text-sm text-gray-500">{summary.expenses.length}件</span>
        <div>
          <span className="text-sm text-gray-500">合計: </span>
          <span className="text-lg font-bold text-gray-900">
            ¥{summary.total_amount.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}
