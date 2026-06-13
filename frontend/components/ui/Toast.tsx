"use client"

import { createContext, useCallback, useContext, useState } from "react"

interface ToastItem {
  id: number
  message: string
  variant: "success" | "error"
}

interface ToastContextValue {
  showToast: (opts: { message: string; variant: "success" | "error" }) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  let nextId = 0

  const showToast = useCallback(
    ({ message, variant }: { message: string; variant: "success" | "error" }) => {
      const id = ++nextId
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, 3000)
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-base min-w-[240px] max-w-sm animate-fade-in ${
              toast.variant === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-white/80 hover:text-white text-lg leading-none"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToastContext must be used within ToastProvider")
  return ctx
}
