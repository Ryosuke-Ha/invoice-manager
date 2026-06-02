import { Badge } from "@/components/ui/Badge"
import { InvoiceStatus, STATUS_LABELS } from "@/types/invoice"

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-100 text-blue-700",
  reminding: "bg-yellow-100 text-yellow-700",
  overdue: "bg-red-100 text-red-700",
  paid: "bg-primary-100 text-primary-700",
  synced_to_freee: "bg-purple-100 text-purple-700",
  completed: "bg-gray-100 text-gray-500",
}

interface Props {
  status: InvoiceStatus
}

export function StatusBadge({ status }: Props) {
  return (
    <Badge className={STATUS_COLORS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
