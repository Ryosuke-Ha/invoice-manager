"use client"

import { useState, useEffect } from "react"
import { InvoiceTemplate } from "@/types/template"
import { useAccountTitles } from "@/hooks/useAccountTitles"

export interface TemplateFormValues {
  title: string
  amount: string
  account_title_id: string
  auto_generate: boolean
}

interface FormErrors {
  title?: string
  amount?: string
}

interface Props {
  initial?: InvoiceTemplate
  onSubmit: (values: TemplateFormValues) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
}

function validate(values: TemplateFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.title.trim()) errors.title = "タイトルは必須です"
  if (!values.amount) {
    errors.amount = "金額は必須です"
  } else {
    const n = Number(values.amount)
    if (!Number.isInteger(n) || n < 1) errors.amount = "金額は1以上の整数を入力してください"
  }
  return errors
}

export function TemplateForm({ initial, onSubmit, submitLabel, isSubmitting }: Props) {
  const { accountTitles } = useAccountTitles(true)

  const [values, setValues] = useState<TemplateFormValues>({
    title: initial?.title ?? "",
    amount: initial?.amount != null ? String(initial.amount) : "",
    account_title_id: initial?.account_title_id ?? "",
    auto_generate: initial?.auto_generate ?? false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setValues({
        title: initial.title,
        amount: String(initial.amount),
        account_title_id: initial.account_title_id ?? "",
        auto_generate: initial.auto_generate,
      })
    }
  }, [initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (field: keyof TemplateFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(values)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSubmitError(null)
    try {
      await onSubmit(values)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "エラーが発生しました")
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"
  const errorClass = "mt-1 text-sm text-red-600"

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>タイトル <span className="text-red-500">*</span></label>
          <input type="text" value={values.title} onChange={setField("title")}
            placeholder="例: 月次業務委託費" className={inputClass} style={{ fontSize: "16px" }} />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label className={labelClass}>金額（円） <span className="text-red-500">*</span></label>
          <input type="number" value={values.amount} onChange={setField("amount")}
            placeholder="例: 100000" min={1} step={1} className={inputClass} style={{ fontSize: "16px" }} />
          {values.amount && !errors.amount && (
            <p className="mt-1 text-sm text-gray-500">¥{Number(values.amount).toLocaleString()}</p>
          )}
          {errors.amount && <p className={errorClass}>{errors.amount}</p>}
        </div>

        <div>
          <label className={labelClass}>勘定科目</label>
          <select value={values.account_title_id} onChange={setField("account_title_id")}
            className={inputClass} style={{ fontSize: "16px" }}>
            <option value="">選択しない</option>
            {accountTitles.map((at) => (
              <option key={at.id} value={at.id}>{at.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-base font-medium text-gray-700">自動生成</label>
          <button
            type="button"
            role="switch"
            aria-checked={values.auto_generate}
            onClick={() => setValues((prev) => ({ ...prev, auto_generate: !prev.auto_generate }))}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              values.auto_generate ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              values.auto_generate ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
        </div>

        {submitError && <p className="text-red-600 text-base">{submitError}</p>}

        <button type="submit" disabled={isSubmitting}
          className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
          {isSubmitting ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  )
}
