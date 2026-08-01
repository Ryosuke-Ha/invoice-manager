"use client"

import { useState } from "react"
import Link from "next/link"
import { useInvoices } from "@/hooks/useInvoices"
import { StatusBadge } from "@/components/invoice/StatusBadge"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"
import { InvoiceStatus, STATUS_LABELS } from "@/types/invoice"

type FilterTab = "active" | "all" | InvoiceStatus

const EXCLUDED_FROM_ACTIVE: InvoiceStatus[] = ["synced_to_freee", "completed"]

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: "未対応", value: "active" },
  { label: STATUS_LABELS.sent, value: "sent" },
  { label: STATUS_LABELS.reminding, value: "reminding" },
  { label: STATUS_LABELS.overdue, value: "overdue" },
  { label: STATUS_LABELS.paid, value: "paid" },
  { label: "全件", value: "all" },
]

function isOverdue(dueDateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDateStr) < today
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("active")
  const { invoices: allInvoices, isLoading, error } = useInvoices()

  const invoices = (() => {
    if (activeTab === "active") {
      return allInvoices.filter((inv) => !EXCLUDED_FROM_ACTIVE.includes(inv.status))
    }
    if (activeTab === "all") return allInvoices
    return allInvoices.filter((inv) => inv.status === activeTab)
  })()

  return (
    <div>
      <PageHeader
        title="請求書"
        action={
          <Link href="/invoices/new">
            <Button variant="primary">新規作成</Button>
          </Link>
        }
      />

      {/* Status filter tabs */}
      <div className="flex overflow-x-auto border-b border-gray-200 mb-4">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.value
                ? "border-primary-500 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        タイトル
                      </th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">
                        金額
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">
                        発生日
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 whitespace-nowrap">
                        支払期日
                      </th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">
                        ステータス
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => {
                      const overdue = isOverdue(invoice.due_date)
                      return (
                        <tr
                          key={invoice.id}
                          className={`border-b border-gray-100 last:border-0 transition-colors ${
                            invoice.status === "overdue"
                              ? "bg-red-50 hover:bg-red-100"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {invoice.title}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-900 whitespace-nowrap">
                            ¥{invoice.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                            {invoice.issue_date}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap ${overdue ? "text-red-600 font-medium" : "text-gray-600"}`}>
                            {invoice.due_date}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={invoice.status} />
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/invoices/${invoice.id}`}
                              className="text-primary-600 text-sm font-medium hover:text-primary-700 transition-colors"
                            >
                              詳細
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
