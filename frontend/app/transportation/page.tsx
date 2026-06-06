"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  useTransportation,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
  useFixTransportation,
  useMergeToInvoice,
  useTransportationTemplates,
  useCreateTransportationTemplate,
  useUpdateTransportationTemplate,
  useDeleteTransportationTemplate,
  useGenerateFromTemplate,
} from "@/hooks/useTransportation"
import { useAccountTitles } from "@/hooks/useAccountTitles"
import { ExpenseTable, TempExpense } from "@/components/transportation/ExpenseTable"
import { Button } from "@/components/ui/Button"
import { TransportationTemplate } from "@/types/transportation"

const now = new Date()
const DEFAULT_YEAR = now.getFullYear()
const DEFAULT_MONTH = now.getMonth() + 1

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: "月曜日" },
  { value: 1, label: "火曜日" },
  { value: 2, label: "水曜日" },
  { value: 3, label: "木曜日" },
  { value: 4, label: "金曜日" },
  { value: 5, label: "土曜日" },
  { value: 6, label: "日曜日" },
]

// Convert JS getDay() (0=Sun..6=Sat) to Python weekday() (0=Mon..6=Sun)
function jsDayToPython(jsDay: number): number {
  return jsDay === 0 ? 6 : jsDay - 1
}

function generateTempExpenses(
  year: number,
  month: number,
  templates: TransportationTemplate[]
): TempExpense[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(year, month - 1, i + 1)
    const dayOfWeek = jsDayToPython(date.getDay())
    const matched = templates.find((t) => t.day_of_week === dayOfWeek)
    return {
      expense_date: `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`,
      amount: matched?.amount ?? 0,
      description: matched?.description ?? "",
    }
  })
}

function isValidTempExpense(t: TempExpense): boolean {
  return t.amount >= 1 && t.description.trim() !== ""
}

interface TemplateFormValues {
  day_of_week: number
  amount: string
  description: string
}

const EMPTY_TEMPLATE_FORM: TemplateFormValues = {
  day_of_week: 0,
  amount: "",
  description: "",
}

export default function TransportationPage() {
  const router = useRouter()
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [month, setMonth] = useState(DEFAULT_MONTH)

  const { summary, isLoading, error } = useTransportation(year, month)
  const { addExpense } = useAddExpense(year, month)
  const { updateExpense } = useUpdateExpense(year, month)
  const { deleteExpense } = useDeleteExpense(year, month)
  const { fixTransportation } = useFixTransportation(year, month)
  const { mergeToInvoice } = useMergeToInvoice(year, month)
  const { accountTitles } = useAccountTitles(true)

  const { templates, isLoading: isTemplatesLoading, mutate: mutateTemplates } = useTransportationTemplates()
  const { generateFromTemplate } = useGenerateFromTemplate(year, month)
  const { createTemplate } = useCreateTransportationTemplate()
  const { updateTemplate } = useUpdateTransportationTemplate()
  const { deleteTemplate } = useDeleteTransportationTemplate()

  const [tempExpenses, setTempExpenses] = useState<TempExpense[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const generatedKeyRef = useRef<string | null>(null)

  // Reset temp rows and generated key on year/month change
  useEffect(() => {
    setTempExpenses([])
    generatedKeyRef.current = null
  }, [year, month])

  // Auto-generate from template when month has no expenses and templates exist
  useEffect(() => {
    const key = `${year}-${month}`
    if (
      !isLoading &&
      !isTemplatesLoading &&
      !error &&
      summary &&
      summary.expenses.length === 0 &&
      templates.length > 0 &&
      generatedKeyRef.current !== key
    ) {
      generatedKeyRef.current = key
      setIsGenerating(true)
      generateFromTemplate()
        .catch(() => {})
        .finally(() => setIsGenerating(false))
    }
  }, [year, month, isLoading, isTemplatesLoading, error, summary?.expenses.length, templates.length])

  // Generate temp rows when month has no expenses and no templates
  useEffect(() => {
    if (
      !isLoading &&
      !isTemplatesLoading &&
      !error &&
      summary &&
      summary.expenses.length === 0 &&
      tempExpenses.length === 0 &&
      templates.length === 0
    ) {
      setTempExpenses(generateTempExpenses(year, month, []))
    }
  }, [year, month, isLoading, isTemplatesLoading, error, summary?.expenses.length, tempExpenses.length, templates.length])

  const handleTempSaved = (expense_date: string) => {
    setTempExpenses((prev) => prev.filter((t) => t.expense_date !== expense_date))
  }

  // Template section state
  const [templateOpen, setTemplateOpen] = useState(false)
  const [showAddRow, setShowAddRow] = useState(false)
  const [addForm, setAddForm] = useState<TemplateFormValues>(EMPTY_TEMPLATE_FORM)
  const [isCreating, setIsCreating] = useState(false)
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<TemplateFormValues>(EMPTY_TEMPLATE_FORM)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)

  const handleCreateTemplate = async () => {
    const amount = Number(addForm.amount)
    if (!Number.isInteger(amount) || amount < 1 || addForm.description.trim() === "") return
    setIsCreating(true)
    try {
      await createTemplate({
        day_of_week: addForm.day_of_week,
        amount,
        description: addForm.description.trim(),
      })
      setAddForm(EMPTY_TEMPLATE_FORM)
      setShowAddRow(false)
      // Regenerate temp expenses with new template
      setTempExpenses([])
    } finally {
      setIsCreating(false)
    }
  }

  const startEditTemplate = (tmpl: TransportationTemplate) => {
    setEditingTemplateId(tmpl.id)
    setEditForm({
      day_of_week: tmpl.day_of_week,
      amount: String(tmpl.amount),
      description: tmpl.description,
    })
  }

  const handleUpdateTemplate = async () => {
    if (!editingTemplateId) return
    const amount = Number(editForm.amount)
    if (!Number.isInteger(amount) || amount < 1 || editForm.description.trim() === "") return
    setIsSavingTemplate(true)
    try {
      await updateTemplate(editingTemplateId, {
        day_of_week: editForm.day_of_week,
        amount,
        description: editForm.description.trim(),
      })
      setEditingTemplateId(null)
      // Regenerate temp expenses with updated template
      setTempExpenses([])
    } finally {
      setIsSavingTemplate(false)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id)
    try {
      await deleteTemplate(id)
      await mutateTemplates()
      // Regenerate temp expenses without deleted template
      setTempExpenses([])
    } finally {
      setDeletingTemplateId(null)
    }
  }

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
      const unsaved = tempExpenses.filter(isValidTempExpense)
      for (const temp of unsaved) {
        await addExpense({
          expense_date: temp.expense_date,
          amount: temp.amount,
          description: temp.description,
        })
      }
      setTempExpenses([])
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

  const hasRealExpenses = (summary?.expenses.length ?? 0) > 0
  const hasTempInput = tempExpenses.some(isValidTempExpense)
  const canFix = hasRealExpenses || hasTempInput

  const isAddFormValid =
    Number.isInteger(Number(addForm.amount)) &&
    Number(addForm.amount) >= 1 &&
    addForm.description.trim() !== ""

  const isEditFormValid =
    Number.isInteger(Number(editForm.amount)) &&
    Number(editForm.amount) >= 1 &&
    editForm.description.trim() !== ""

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-6 pr-14 lg:pr-0">
        <h1 className="text-2xl font-bold text-gray-900">月次交通費</h1>
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

      {/* Template settings (collapsible) */}
      <div className="bg-white border border-gray-200 rounded-lg mb-4">
        <button
          onClick={() => setTemplateOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
        >
          <span>テンプレート設定</span>
          <span className="text-gray-400 text-sm">{templateOpen ? "▲" : "▼"}</span>
        </button>

        {templateOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-base min-w-[480px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-sm font-medium text-gray-500 w-28">曜日</th>
                    <th className="text-right px-3 py-2 text-sm font-medium text-gray-500 w-28">金額（円）</th>
                    <th className="text-left px-3 py-2 text-sm font-medium text-gray-500">内容・区間</th>
                    <th className="px-3 py-2 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tmpl) => {
                    const isEditing = editingTemplateId === tmpl.id
                    return (
                      <tr key={tmpl.id} className="border-b border-gray-100 last:border-0">
                        {isEditing ? (
                          <>
                            <td className="px-2 py-1.5">
                              <select
                                value={editForm.day_of_week}
                                onChange={(e) =>
                                  setEditForm((v) => ({ ...v, day_of_week: Number(e.target.value) }))
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                style={{ fontSize: "16px" }}
                                disabled={isSavingTemplate}
                              >
                                {DAY_OF_WEEK_OPTIONS.map((o) => (
                                  <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="number"
                                value={editForm.amount}
                                onChange={(e) =>
                                  setEditForm((v) => ({ ...v, amount: e.target.value }))
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-base text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                style={{ fontSize: "16px" }}
                                min={1}
                                disabled={isSavingTemplate}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <input
                                type="text"
                                value={editForm.description}
                                onChange={(e) =>
                                  setEditForm((v) => ({ ...v, description: e.target.value }))
                                }
                                className="w-full border border-gray-300 rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                style={{ fontSize: "16px" }}
                                disabled={isSavingTemplate}
                              />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-1">
                                <button
                                  onClick={handleUpdateTemplate}
                                  disabled={isSavingTemplate || !isEditFormValid}
                                  className="px-2 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50 transition-colors"
                                >
                                  {isSavingTemplate ? "..." : "保存"}
                                </button>
                                <button
                                  onClick={() => setEditingTemplateId(null)}
                                  disabled={isSavingTemplate}
                                  className="px-2 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2.5 text-base text-gray-700">{tmpl.day_of_week_label}</td>
                            <td className="px-3 py-2.5 text-base text-gray-900 text-right whitespace-nowrap">
                              {tmpl.amount.toLocaleString()}円
                            </td>
                            <td className="px-3 py-2.5 text-base text-gray-900">{tmpl.description}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex gap-1 justify-end">
                                <button
                                  onClick={() => startEditTemplate(tmpl)}
                                  className="text-primary-600 text-sm px-2 py-1 rounded hover:bg-primary-50 transition-colors"
                                >
                                  編集
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(tmpl.id)}
                                  disabled={deletingTemplateId === tmpl.id}
                                  className="text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  削除
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  })}

                  {/* Add row */}
                  {showAddRow && (
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <td className="px-2 py-1.5">
                        <select
                          value={addForm.day_of_week}
                          onChange={(e) =>
                            setAddForm((v) => ({ ...v, day_of_week: Number(e.target.value) }))
                          }
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                          style={{ fontSize: "16px" }}
                          disabled={isCreating}
                        >
                          {DAY_OF_WEEK_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="number"
                          value={addForm.amount}
                          onChange={(e) =>
                            setAddForm((v) => ({ ...v, amount: e.target.value }))
                          }
                          placeholder="金額"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-base text-right bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                          style={{ fontSize: "16px" }}
                          min={1}
                          disabled={isCreating}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={addForm.description}
                          onChange={(e) =>
                            setAddForm((v) => ({ ...v, description: e.target.value }))
                          }
                          placeholder="内容・区間（例: 渋谷→新宿）"
                          className="w-full border border-gray-300 rounded px-2 py-1.5 text-base bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
                          style={{ fontSize: "16px" }}
                          disabled={isCreating}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <div className="flex gap-1">
                          <button
                            onClick={handleCreateTemplate}
                            disabled={isCreating || !isAddFormValid}
                            className="px-2 py-1 bg-primary-500 text-white text-sm rounded hover:bg-primary-600 disabled:opacity-50 transition-colors"
                          >
                            {isCreating ? "..." : "追加"}
                          </button>
                          <button
                            onClick={() => { setShowAddRow(false); setAddForm(EMPTY_TEMPLATE_FORM) }}
                            disabled={isCreating}
                            className="px-2 py-1 border border-gray-300 text-gray-600 text-sm rounded hover:bg-gray-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {!showAddRow && (
              <button
                onClick={() => { setShowAddRow(true); setAddForm(EMPTY_TEMPLATE_FORM) }}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 transition-colors"
              >
                + テンプレートを追加
              </button>
            )}
            {templates.length === 0 && !showAddRow && (
              <p className="text-sm text-gray-400 mt-2">テンプレートがありません</p>
            )}
          </div>
        )}
      </div>

      {isGenerating && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg px-6 py-4 text-base font-medium text-gray-700 shadow-lg">
            交通費を自動生成中...
          </div>
        </div>
      )}

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
            <ExpenseTable
              isFixed={summary?.is_fixed ?? false}
              expenses={summary?.expenses ?? []}
              tempExpenses={tempExpenses}
              onAdd={handleAddExpense}
              onUpdate={handleUpdateExpense}
              onDelete={handleDeleteExpense}
              onTempSaved={handleTempSaved}
            />
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
                disabled={!canFix}
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
