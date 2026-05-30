"use client"

import { useState } from "react"

export interface ExpenseFormValues {
  expense_date: string
  amount: string
  description: string
}

interface FormErrors {
  expense_date?: string
  amount?: string
  description?: string
}

interface Props {
  initial?: Partial<ExpenseFormValues>
  onSubmit: (values: ExpenseFormValues) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
  onCancel?: () => void
}

function validate(values: ExpenseFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.expense_date) errors.expense_date = "日付は必須です"
  if (!values.amount) {
    errors.amount = "金額は必須です"
  } else {
    const n = Number(values.amount)
    if (!Number.isInteger(n) || n < 1) errors.amount = "金額は1以上の整数を入力してください"
  }
  if (!values.description.trim()) errors.description = "内容は必須です"
  return errors
}

export function ExpenseForm({
  initial,
  onSubmit,
  submitLabel,
  isSubmitting,
  onCancel,
}: Props) {
  const [values, setValues] = useState<ExpenseFormValues>({
    expense_date: initial?.expense_date ?? "",
    amount: initial?.amount ?? "",
    description: initial?.description ?? "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const set = (field: keyof ExpenseFormValues) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitError(null)
    try {
      await onSubmit(values)
      // Reset on success (add mode)
      if (!initial?.expense_date) {
        setValues({ expense_date: "", amount: "", description: "" })
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  const errorClass = "mt-1 text-sm text-red-600"

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日付 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={values.expense_date}
            onChange={set("expense_date")}
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.expense_date && <p className={errorClass}>{errors.expense_date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            金額（円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={values.amount}
            onChange={set("amount")}
            placeholder="例: 300"
            min={1}
            step={1}
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.amount && <p className={errorClass}>{errors.amount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            内容・区間 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.description}
            onChange={set("description")}
            placeholder="例: 渋谷→新宿"
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.description && <p className={errorClass}>{errors.description}</p>}
        </div>

        {submitError && <p className="text-red-600 text-base">{submitError}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          )}
        </div>
      </div>
    </form>
  )
}
