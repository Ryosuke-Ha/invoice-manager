"use client"

import { useState, useRef, useEffect } from "react"
import { MonthlyTransportationSummary } from "@/types/transportation"

interface EditValues {
  expense_date: string
  amount: string
  description: string
}

interface Props {
  summary: MonthlyTransportationSummary
  onAdd: (values: { expense_date: string; amount: number; description: string }) => Promise<void>
  onUpdate: (expenseId: string, values: { expense_date: string; amount: number; description: string }) => Promise<void>
  onDelete: (expenseId: string) => Promise<void>
}

const EMPTY: EditValues = { expense_date: "", amount: "", description: "" }

function formatDate(s: string) {
  return s.replace(/-/g, "/")
}

function isValid(v: EditValues): boolean {
  const n = Number(v.amount)
  return v.expense_date !== "" && Number.isInteger(n) && n >= 1 && v.description.trim() !== ""
}

const inputClass =
  "w-full border border-gray-300 rounded px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

export function ExpenseTable({ summary, onAdd, onUpdate, onDelete }: Props) {
  const isFixed = summary.is_fixed
  const expenses = summary.expenses

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<EditValues>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)

  const [newValues, setNewValues] = useState<EditValues>(EMPTY)
  const [isAdding, setIsAdding] = useState(false)

  const editDateRef = useRef<HTMLInputElement>(null)
  const newDateRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId !== null) {
      editDateRef.current?.focus()
    }
  }, [editingId])

  const startEdit = (id: string, values: EditValues) => {
    if (isFixed) return
    setEditingId(id)
    setEditValues(values)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditValues(EMPTY)
  }

  const saveEdit = async (goToNext: boolean) => {
    if (!editingId || !isValid(editValues) || isSaving) return
    setIsSaving(true)
    try {
      await onUpdate(editingId, {
        expense_date: editValues.expense_date,
        amount: Number(editValues.amount),
        description: editValues.description,
      })
      if (goToNext) {
        const idx = expenses.findIndex((e) => e.id === editingId)
        const next = idx !== -1 && idx < expenses.length - 1 ? expenses[idx + 1] : null
        if (next) {
          setEditingId(next.id)
          setEditValues({
            expense_date: next.expense_date,
            amount: String(next.amount),
            description: next.description,
          })
        } else {
          setEditingId(null)
          setEditValues(EMPTY)
          setTimeout(() => newDateRef.current?.focus(), 50)
        }
      } else {
        setEditingId(null)
        setEditValues(EMPTY)
      }
    } catch {
      // editing state is kept on error
    } finally {
      setIsSaving(false)
    }
  }

  const addNew = async () => {
    if (!isValid(newValues) || isAdding) return
    setIsAdding(true)
    try {
      await onAdd({
        expense_date: newValues.expense_date,
        amount: Number(newValues.amount),
        description: newValues.description,
      })
      setNewValues(EMPTY)
      setTimeout(() => newDateRef.current?.focus(), 50)
    } catch {
      // keep values on error
    } finally {
      setIsAdding(false)
    }
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); saveEdit(true) }
    else if (e.key === "Escape") { e.preventDefault(); cancelEdit() }
  }

  const handleNewKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") { e.preventDefault(); addNew() }
  }

  const total = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div>
      {isFixed && (
        <div className="mb-3">
          <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            確定済み
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-base min-w-[480px]">
          <thead>
            <tr className="bg-gray-50 border-b-2 border-gray-200">
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-600 w-32 min-w-[120px]">
                日付
              </th>
              <th className="text-right px-3 py-2.5 text-sm font-semibold text-gray-600 w-28 min-w-[100px]">
                金額（円）
              </th>
              <th className="text-left px-3 py-2.5 text-sm font-semibold text-gray-600">
                内容・区間
              </th>
              {!isFixed && (
                <th className="px-3 py-2.5 text-sm font-semibold text-gray-600 w-24 min-w-[80px]">
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => {
              const isEditing = editingId === expense.id
              return (
                <tr
                  key={expense.id}
                  className={`border-b border-gray-100 transition-colors ${
                    isEditing
                      ? "bg-blue-50"
                      : isFixed
                      ? ""
                      : "hover:bg-gray-50 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isEditing && !isFixed) {
                      startEdit(expense.id, {
                        expense_date: expense.expense_date,
                        amount: String(expense.amount),
                        description: expense.description,
                      })
                    }
                  }}
                >
                  {isEditing ? (
                    <>
                      <td className="px-2 py-1.5">
                        <input
                          ref={editDateRef}
                          type="date"
                          value={editValues.expense_date}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, expense_date: e.target.value }))
                          }
                          onKeyDown={handleEditKeyDown}
                          className={inputClass}
                          style={{ fontSize: "16px" }}
                          disabled={isSaving}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={editValues.amount}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, amount: e.target.value }))
                          }
                          onKeyDown={handleEditKeyDown}
                          className={`${inputClass} text-right`}
                          style={{ fontSize: "16px" }}
                          min={1}
                          step={1}
                          disabled={isSaving}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, description: e.target.value }))
                          }
                          onKeyDown={handleEditKeyDown}
                          className={inputClass}
                          style={{ fontSize: "16px" }}
                          disabled={isSaving}
                        />
                      </td>
                      <td
                        className="px-2 py-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveEdit(false)}
                            disabled={isSaving || !isValid(editValues)}
                            className="px-2 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                          >
                            {isSaving ? "..." : "保存"}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isSaving}
                            className="px-2 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-3 text-base text-gray-700 whitespace-nowrap">
                        {formatDate(expense.expense_date)}
                      </td>
                      <td className="px-3 py-3 text-base text-gray-900 text-right whitespace-nowrap">
                        {expense.amount.toLocaleString()}円
                      </td>
                      <td className="px-3 py-3 text-base text-gray-900">
                        {expense.description}
                      </td>
                      {!isFixed && (
                        <td
                          className="px-3 py-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onDelete(expense.id)}
                            className="text-red-500 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            削除
                          </button>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              )
            })}

            {/* 新規入力行（未確定時のみ） */}
            {!isFixed && (
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <td className="px-2 py-1.5">
                  <input
                    ref={newDateRef}
                    type="date"
                    value={newValues.expense_date}
                    onChange={(e) =>
                      setNewValues((v) => ({ ...v, expense_date: e.target.value }))
                    }
                    onKeyDown={handleNewKeyDown}
                    className={`${inputClass} text-gray-500`}
                    style={{ fontSize: "16px" }}
                    disabled={isAdding}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={newValues.amount}
                    onChange={(e) =>
                      setNewValues((v) => ({ ...v, amount: e.target.value }))
                    }
                    onKeyDown={handleNewKeyDown}
                    placeholder="金額"
                    className={`${inputClass} text-right text-gray-500 placeholder:text-gray-300`}
                    style={{ fontSize: "16px" }}
                    min={1}
                    step={1}
                    disabled={isAdding}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={newValues.description}
                    onChange={(e) =>
                      setNewValues((v) => ({ ...v, description: e.target.value }))
                    }
                    onKeyDown={handleNewKeyDown}
                    placeholder="内容・区間（例: 渋谷→新宿）"
                    className={`${inputClass} text-gray-500 placeholder:text-gray-300`}
                    style={{ fontSize: "16px" }}
                    disabled={isAdding}
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={addNew}
                    disabled={isAdding || !isValid(newValues)}
                    className="px-2 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    {isAdding ? "..." : "追加"}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 合計 */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm text-gray-500">{expenses.length}件</span>
        <div>
          <span className="text-base text-gray-500">合計: </span>
          <span className="text-lg font-bold text-gray-900">
            {total.toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  )
}
