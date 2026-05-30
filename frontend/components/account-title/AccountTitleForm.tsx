"use client"

import { useState, useEffect } from "react"
import { AccountTitle } from "@/types/account_title"

export interface AccountTitleFormValues {
  name: string
  account_type: "income" | "expense"
  freee_company_id: string
  freee_account_item_id: string
  freee_tax_code: string
}

interface FormErrors {
  name?: string
  freee_company_id?: string
  freee_account_item_id?: string
  freee_tax_code?: string
}

interface Props {
  initial?: AccountTitle
  onSubmit: (values: AccountTitleFormValues) => Promise<void>
  submitLabel: string
  isSubmitting: boolean
}

function validate(values: AccountTitleFormValues): FormErrors {
  const errors: FormErrors = {}
  if (!values.name.trim()) errors.name = "勘定科目名は必須です"
  if (!values.freee_company_id) errors.freee_company_id = "freee 会社IDは必須です"
  if (!values.freee_account_item_id) errors.freee_account_item_id = "freee 勘定科目IDは必須です"
  if (!values.freee_tax_code) errors.freee_tax_code = "freee 税コードは必須です"
  return errors
}

export function AccountTitleForm({ initial, onSubmit, submitLabel, isSubmitting }: Props) {
  const [values, setValues] = useState<AccountTitleFormValues>({
    name: initial?.name ?? "",
    account_type: initial?.account_type ?? "income",
    freee_company_id: initial?.freee_company_id != null ? String(initial.freee_company_id) : "",
    freee_account_item_id: initial?.freee_account_item_id != null ? String(initial.freee_account_item_id) : "",
    freee_tax_code: initial?.freee_tax_code != null ? String(initial.freee_tax_code) : "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (initial) {
      setValues({
        name: initial.name,
        account_type: initial.account_type,
        freee_company_id: String(initial.freee_company_id),
        freee_account_item_id: String(initial.freee_account_item_id),
        freee_tax_code: String(initial.freee_tax_code),
      })
    }
  }, [initial?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const setField = (field: keyof AccountTitleFormValues) => (
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
          <label className={labelClass}>勘定科目名 <span className="text-red-500">*</span></label>
          <input type="text" value={values.name} onChange={setField("name")}
            placeholder="例: 売上高" className={inputClass} style={{ fontSize: "16px" }} />
          {errors.name && <p className={errorClass}>{errors.name}</p>}
        </div>

        <div>
          <label className={labelClass}>区分 <span className="text-red-500">*</span></label>
          <select value={values.account_type} onChange={setField("account_type")}
            className={inputClass} style={{ fontSize: "16px" }}>
            <option value="income">売上</option>
            <option value="expense">支出</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>freee 会社ID <span className="text-red-500">*</span></label>
          <input type="number" value={values.freee_company_id} onChange={setField("freee_company_id")}
            placeholder="例: 123456" min={1} className={inputClass} style={{ fontSize: "16px" }} />
          {errors.freee_company_id && <p className={errorClass}>{errors.freee_company_id}</p>}
        </div>

        <div>
          <label className={labelClass}>freee 勘定科目ID <span className="text-red-500">*</span></label>
          <input type="number" value={values.freee_account_item_id} onChange={setField("freee_account_item_id")}
            placeholder="例: 789" min={1} className={inputClass} style={{ fontSize: "16px" }} />
          {errors.freee_account_item_id && <p className={errorClass}>{errors.freee_account_item_id}</p>}
        </div>

        <div>
          <label className={labelClass}>freee 税コード <span className="text-red-500">*</span></label>
          <input type="number" value={values.freee_tax_code} onChange={setField("freee_tax_code")}
            placeholder="例: 1" min={0} className={inputClass} style={{ fontSize: "16px" }} />
          {errors.freee_tax_code && <p className={errorClass}>{errors.freee_tax_code}</p>}
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
