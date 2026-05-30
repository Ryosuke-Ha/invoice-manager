import Link from "next/link"
import { Invoice } from "@/types/invoice"
import { StatusBadge } from "./StatusBadge"

interface Props {
  invoice: Invoice
}

function isOverdue(dueDateStr: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(dueDateStr) < today
}

export function InvoiceCard({ invoice }: Props) {
  const overdue = isOverdue(invoice.due_date)

  return (
    <Link href={`/invoices/${invoice.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <p className="text-base font-semibold text-gray-900 break-all">
            {invoice.title}
          </p>
          <StatusBadge status={invoice.status} />
        </div>
        <p className="mt-2 text-lg font-bold text-gray-800">
          ¥{invoice.amount.toLocaleString()}
        </p>
        <p className={`mt-1 text-sm ${overdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
          支払期日: {invoice.due_date}
          {overdue && " ⚠️ 期日超過"}
        </p>
      </div>
    </Link>
  )
}
