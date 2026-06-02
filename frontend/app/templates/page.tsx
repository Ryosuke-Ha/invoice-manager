"use client"

import { useState } from "react"
import { useTemplates } from "@/hooks/useTemplates"
import { TemplateList } from "@/components/template/TemplateList"
import { TemplateForm, TemplateFormValues } from "@/components/template/TemplateForm"
import { InvoiceTemplate } from "@/types/template"
import { PageHeader } from "@/components/ui/PageHeader"
import { Button } from "@/components/ui/Button"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function TemplatesPage() {
  const { templates, isLoading, error, mutate } = useTemplates()

  const [modalMode, setModalMode] = useState<"add" | "edit" | null>(null)
  const [editTarget, setEditTarget] = useState<InvoiceTemplate | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const openAdd = () => { setEditTarget(null); setModalMode("add") }
  const openEdit = (tmpl: InvoiceTemplate) => { setEditTarget(tmpl); setModalMode("edit") }
  const closeModal = () => { setModalMode(null); setEditTarget(null) }

  const handleSubmit = async (values: TemplateFormValues) => {
    setIsSubmitting(true)
    try {
      const body = {
        title: values.title,
        amount: Number(values.amount),
        account_title_id: values.account_title_id || null,
        auto_generate: values.auto_generate,
      }

      if (modalMode === "edit" && editTarget) {
        const res = await fetch(`${API_URL}/api/templates/${editTarget.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }
      } else {
        const res = await fetch(`${API_URL}/api/templates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { detail?: string }
          throw new Error(err.detail ?? `HTTP ${res.status}`)
        }
      }

      await mutate()
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`${API_URL}/api/templates/${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    await mutate()
  }

  const handleToggleAutoGenerate = async (tmpl: InvoiceTemplate) => {
    const res = await fetch(`${API_URL}/api/templates/${tmpl.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ auto_generate: !tmpl.auto_generate }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { detail?: string }
      throw new Error(err.detail ?? `HTTP ${res.status}`)
    }
    await mutate()
  }

  return (
    <div>
      <PageHeader
        title="テンプレート管理"
        action={
          <Button variant="primary" onClick={openAdd}>
            新規追加
          </Button>
        }
      />

      {isLoading && (
        <p className="text-gray-400 text-base animate-pulse text-center py-8">読み込み中...</p>
      )}
      {error && (
        <p className="text-red-600 text-base text-center py-8">データの取得に失敗しました</p>
      )}
      {!isLoading && !error && (
        <TemplateList
          templates={templates}
          onEdit={openEdit}
          onDelete={handleDelete}
          onToggleAutoGenerate={handleToggleAutoGenerate}
        />
      )}

      {/* Add/Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm my-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              {modalMode === "add" ? "テンプレートを追加" : "テンプレートを編集"}
            </h2>
            <TemplateForm
              initial={editTarget ?? undefined}
              onSubmit={handleSubmit}
              submitLabel={modalMode === "add" ? "追加" : "更新"}
              isSubmitting={isSubmitting}
            />
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="mt-3 w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-lg text-base font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
