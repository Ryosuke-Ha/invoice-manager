"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const NAV_ITEMS = [
  { href: "/invoices", label: "請求書" },
  { href: "/transportation", label: "交通費" },
  { href: "/account-titles", label: "勘定科目" },
  { href: "/templates", label: "テンプレート" },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-6 pb-0">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-shrink-0 px-4 py-3 text-base font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
