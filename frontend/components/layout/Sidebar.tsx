"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { FileText, Train, BookOpen, Layout } from "lucide-react"

const NAV_ITEMS = [
  { href: "/invoices", label: "請求書", icon: FileText },
  { href: "/transportation", label: "交通費", icon: Train },
  { href: "/account-titles", label: "勘定科目", icon: BookOpen },
  { href: "/templates", label: "テンプレート", icon: Layout },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  if (status !== "authenticated") {
    return null
  }

  const user = session?.user
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "?"

  return (
    <aside className="fixed top-0 left-0 h-screen w-60 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* ① App name */}
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-lg font-bold text-gray-900">invoice-manager</span>
      </div>

      {/* ② Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-3.5 text-base transition-colors border-l-4 ${
                isActive
                  ? "bg-green-50 text-green-700 font-semibold border-green-600"
                  : "text-gray-700 hover:bg-gray-50 border-transparent"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* ③ User info & logout */}
      <div className="border-t border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3 mb-3">
          {user?.image ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={user.image}
              alt={user.name ?? "avatar"}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white text-base font-semibold">
              {initial.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            {user?.name && (
              <p className="text-base font-semibold text-gray-900 truncate">
                {user.name}
              </p>
            )}
            {user?.email && (
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full text-left text-base text-red-600 hover:text-red-700 py-2 transition-colors"
        >
          ログアウト
        </button>
      </div>
    </aside>
  )
}
