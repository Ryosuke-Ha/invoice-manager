"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState } from "react"

const NAV_ITEMS = [
  { href: "/invoices", label: "請求書" },
  { href: "/transportation", label: "交通費" },
  { href: "/account-titles", label: "勘定科目" },
  { href: "/templates", label: "テンプレート" },
]

export function HamburgerMenu() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  if (status !== "authenticated") {
    return null
  }

  const user = session?.user
  const initial = user?.name?.charAt(0) ?? user?.email?.charAt(0) ?? "?"

  return (
    <>
      {/* オーバーレイ */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* ハンバーガーボタン */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-4 right-4 z-50 flex flex-col justify-center items-center w-11 h-11 bg-white rounded-lg shadow-md gap-1.5 p-2.5"
        aria-label={isOpen ? "メニューを閉じる" : "メニューを開く"}
      >
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-200 origin-center ${
            isOpen ? "rotate-45 translate-y-2" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-200 ${
            isOpen ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-gray-700 transition-all duration-200 origin-center ${
            isOpen ? "-rotate-45 -translate-y-2" : ""
          }`}
        />
      </button>

      {/* ドロワー */}
      <div
        className={`fixed top-0 right-0 h-full w-3/4 max-w-[280px] bg-white z-50 flex flex-col shadow-xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ① ユーザー情報 */}
        <div className="px-5 pt-6 pb-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {user?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.image}
                alt={user.name ?? "avatar"}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-lg font-semibold">
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
        </div>

        {/* ② ナビゲーション */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-5 py-3.5 text-base transition-colors ${
                  isActive
                    ? "bg-green-50 text-green-700 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* ③ ログアウトボタン */}
        <div className="border-t border-gray-200 px-5 py-4">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full text-left text-base text-red-600 hover:text-red-700 py-2 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </div>
    </>
  )
}
