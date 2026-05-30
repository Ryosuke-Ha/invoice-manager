"use client"

import { useState, useEffect } from "react"
import { useAccountTitles } from "@/hooks/useAccountTitles"
import { Invoice } from "@/types/invoice"

export interface InvoiceFormValues {
  title: string
  amount: string
  issue_date: string
  due_date: string
  account_title_id: string
}

interface FormErrors {
  title?: string
  amount?: string
  issue_date?: string
  due_date?: string
}

interface Props {
  initial?: Partial<Invoice>
  onSubmit: (values: InvoiceFormValues) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
}

function validateForm(values: InvoiceFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.title.trim()) errors.title = "タイトルは必須です"

  const amount = Number(values.amount)
  if (!values.amount) {
    errors.amount = "金額は必須です"
  } else if (!Number.isInteger(amount) || amount < 1) {
    errors.amount = "金額は1以上の整数を入力してください"
  }

  if (!values.issue_date) {
    errors.issue_date = "発行日は必須です"
  } else {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (new Date(values.issue_date) > today) {
      errors.issue_date = "発行日は今日以前の日付を入力してください"
    }
  }

  if (!values.due_date) {
    errors.due_date = "支払期日は必須です"
  } else if (values.issue_date && new Date(values.due_date) < new Date(values.issue_date)) {
    errors.due_date = "支払期日は発行日以降の日付を入力してください"
  }

  return errors
}

export function InvoiceForm({ initial, onSubmit, submitLabel, isSubmitting }: Props) {
  const { accountTitles } = useAccountTitles(true)

  const [values, setValues] = useState<InvoiceFormValues>({
    title: initial?.title ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    issue_date: initial?.issue_date ?? "",
    due_date: initial?.due_date ?? "",
    account_title_id: initial?.account_title_id ?? "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setValues({
        title: initial.title ?? "",
        amount: initial.amount != null ? String(initial.amount) : "",
        issue_date: initial.issue_date ?? "",
        due_date: initial.due_date ?? "",
        account_title_id: initial.account_title_id ?? "",
      })
    }
  }, [initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const set = (field: keyof InvoiceFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validateForm(values)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSubmitError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  const errorClass = "mt-1 text-sm text-red-600"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className={labelClass}>
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={values.title}
            onChange={set("title")}
            placeholder="例: 2024年1月分請求書"
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className={labelClass}>
            金額（円） <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            value={values.amount}
            onChange={set("amount")}
            placeholder="例: 100000"
            min={1}
            step={1}
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {values.amount && !errors.amount && (
            <p className="mt-1 text-sm text-gray-500">
              ¥{Number(values.amount).toLocaleString()}
            </p>
          )}
          {errors.amount && <p className={errorClass}>{errors.amount}</p>}
        </div>

        {/* Issue date */}
        <div>
          <label className={labelClass}>
            発行日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={values.issue_date}
            onChange={set("issue_date")}
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.issue_date && <p className={errorClass}>{errors.issue_date}</p>}
        </div>

        {/* Due date */}
        <div>
          <label className={labelClass}>
            支払期日 <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={values.due_date}
            onChange={set("due_date")}
            className={inputClass}
            style={{ fontSize: "16px" }}
          />
          {errors.due_date && <p className={errorClass}>{errors.due_date}</p>}
        </div>

        {/* Account title */}
        <div>
          <label className={labelClass}>勘定科目</label>
          <select
            value={values.account_title_id}
            onChange={set("account_title_id")}
            className={inputClass}
            style={{ fontSize: "16px" }}
          >
            <option value="">選択しない</option>
            {accountTitles.map((at) => (
              <option key={at.id} value={at.id}>
                {at.name}
              </option>
            ))}
          </select>
        </div>

        {submitError && (
          <p className="text-red-600 text-base">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
