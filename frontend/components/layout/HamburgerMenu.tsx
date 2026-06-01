"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"

const NAV_ITEMS = [
  { href: "/invoices", label: "請求書" },
  { href: "/transportation", label: "交通費" },
  { href: "/account-titles", label: "勘定科目" },
  { href: "/templates", label: "テンプレート" },
]

export function HamburgerMenu() {
  const pathname = usePathname()
  const { status } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  if (status !== "authenticated") {
    return null
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div ref={menuRef} className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex flex-col justify-center items-center w-11 h-11 bg-white rounded-lg shadow-md gap-1.5 p-2.5"
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

        <div
          className={`absolute top-13 right-0 w-48 bg-white rounded-xl shadow-lg py-2 transition-all duration-200 ${
            isOpen
              ? "opacity-100 translate-x-0"
              : "opacity-0 translate-x-4 pointer-events-none"
          }`}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`block px-5 py-3 text-base transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
