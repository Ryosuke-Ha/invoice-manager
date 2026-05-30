"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useInvoice } from "@/hooks/useInvoices"
import { InvoiceForm, InvoiceFormValues } from "@/components/invoice/InvoiceForm"
import { Invoice } from "@/types/invoice"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const { invoice, isLoading } = useInvoice(id)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [redirected, setRedirected] = useState(false)

  // Redirect if not Draft
  useEffect(() => {
    if (!isLoading && invoice && invoice.status !== "draft" && !redirected) {
      setRedirected(true)
      router.replace(`/invoices/${id}`)
    }
  }, [invoice, isLoading, id, router, redirected])

  if (isLoading) {
    return (
      <p className="text-gray-400 text-base animate-pulse text-center py-8">
        読み込み中...
      </p>
    )
  }

  if (!invoice) {
    return (
      <p className="text-red-600 text-base text-center py-8">
        請求書が見つかりません
      </p>
    )
  }

  if (invoice.status !== "draft") {
    return null
  }

  const handleSubmit = async (values: InvoiceFormValues) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/api/invoices/${id}`, {
        method: "PUT",
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
      await res.json() as Invoice
      router.push(`/invoices/${id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/invoices/${id}`} className="text-blue-600 text-base">
          ← 詳細
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">請求書編集</h1>

      <InvoiceForm
        initial={invoice}
        onSubmit={handleSubmit}
        submitLabel="更新"
        isSubmitting={isSubmitting}
      />

      <button
        onClick={() => router.push(`/invoices/${id}`)}
        disabled={isSubmitting}
        className="mt-3 w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        キャンセル
      </button>
    </div>
  )
}
