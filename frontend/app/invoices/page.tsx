"use client"

import { useState } from "react"
import Link from "next/link"
import { useInvoices } from "@/hooks/useInvoices"
import { InvoiceCard } from "@/components/invoice/InvoiceCard"
import { InvoiceStatus, STATUS_LABELS } from "@/types/invoice"

type FilterTab = "all" | InvoiceStatus

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "全件", value: "all" },
  { label: STATUS_LABELS.draft, value: "draft" },
  { label: STATUS_LABELS.sent, value: "sent" },
  { label: STATUS_LABELS.reminding, value: "reminding" },
  { label: STATUS_LABELS.overdue, value: "overdue" },
  { label: STATUS_LABELS.paid, value: "paid" },
]

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all")
  const status = activeTab === "all" ? undefined : activeTab
  const { invoices, isLoading, error } = useInvoices(status)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">請求書</h1>
        <Link
          href="/invoices/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-base font-medium hover:bg-blue-700 transition-colors"
        >
          新規作成
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          <p className="text-sm text-gray-500 mb-3">{invoices.length}件</p>
          {invoices.length === 0 ? (
            <p className="text-gray-400 text-base text-center py-8">
              請求書がありません
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {invoices.map((invoice) => (
                <InvoiceCard key={invoice.id} invoice={invoice} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
