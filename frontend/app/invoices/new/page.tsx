"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { InvoiceForm, InvoiceFormValues } from "@/components/invoice/InvoiceForm"
import { useTemplates } from "@/hooks/useTemplates"
import { Invoice } from "@/types/invoice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type Tab = "manual" | "template"

const CURRENT_YEAR = new Date().getFullYear()
const CURRENT_MONTH = new Date().getMonth() + 1

export default function NewInvoicePage() {
  const router = useRouter()
  const { templates, isLoading: templatesLoading } = useTemplates()

  const [tab, setTab] = useState<Tab>("manual")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Template mode state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [year, setYear] = useState(CURRENT_YEAR)
  const [month, setMonth] = useState(CURRENT_MONTH)
  const [templateError, setTemplateError] = useState<string | null>(null)

  const handleManualSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          amount: Number(values.amount),
          issue_date: values.issue_date,
          due_date: values.due_date,
          account_title_id: values.account_title_id || null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      const created = await res.json() as Invoice
      router.push(`/invoices/${created.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateCreate = async () => {
    if (!selectedTemplateId) {
      setTemplateError("テンプレートを選択してください")
      return
    }
    setTemplateError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template_id: selectedTemplateId,
          year,
          month,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string }
        throw new Error(body.detail ?? `HTTP ${res.status}`)
      }
      const created = await res.json() as Invoice
      router.push(`/invoices/${created.id}`)
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "作成に失敗しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const inputClass =
    "border border-gray-300 rounded-lg px-3 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href="/invoices" className="text-blue-600 text-base">
          ← 一覧
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">請求書作成</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["manual", "template"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-base font-medium transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "manual" ? "手動作成" : "テンプレートから作成"}
          </button>
        ))}
      </div>

      {/* Manual creation */}
      {tab === "manual" && (
        <InvoiceForm
          onSubmit={handleManualSubmit}
          submitLabel="作成"
          isSubmitting={isSubmitting}
        />
      )}

      {/* Template creation */}
      {tab === "template" && (
        <div>
          {templatesLoading ? (
            <p className="text-gray-400 text-base animate-pulse text-center py-8">
              読み込み中...
            </p>
          ) : templates.length === 0 ? (
            <p className="text-gray-500 text-base text-center py-8">
              テンプレートがありません
            </p>
          ) : (
            <div className="space-y-3 mb-6">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setSelectedTemplateId(tmpl.id)
                    setTemplateError(null)
                  }}
                  className={`w-full text-left border rounded-lg p-4 transition-colors ${
                    selectedTemplateId === tmpl.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="text-base font-medium text-gray-900">
                    {tmpl.title}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    ¥{tmpl.amount.toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Year/month picker (shown after template selected) */}
          {selectedTemplate && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">対象年月</p>
              <div className="flex gap-2">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputClass}
                  style={{ fontSize: "16px" }}
                >
                  {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => (
                    <option key={y} value={y}>{y}年</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className={inputClass}
                  style={{ fontSize: "16px" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}月</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {templateError && (
            <p className="mb-3 text-red-600 text-base">{templateError}</p>
          )}

          <button
            onClick={handleTemplateCreate}
            disabled={isSubmitting || !selectedTemplateId}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "作成中..." : "作成"}
          </button>
        </div>
      )}
    </div>
  )
}
