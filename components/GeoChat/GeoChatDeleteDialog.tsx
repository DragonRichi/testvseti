"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import { RefreshCw, Trash2, X } from "lucide-react"
import { createPortal } from "react-dom"

type Props = {
    target: GeoChatMessage | null
    isDeleting: boolean
    onClose: () => void
    onConfirm: () => void
}

function GeoChatDeleteDialog({ target, isDeleting, onClose, onConfirm }: Props) {
    if (typeof document === "undefined" || !target) return null

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/35 px-4" onPointerDown={(event) => { if (event.target === event.currentTarget && !isDeleting) onClose() }}>
            <div className="w-full max-w-[360] rounded-3xl bg-white p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-base font-bold text-gray-900">
                            Удалить сообщение?
                        </div>

                        <div className="mt-1.5 text-sm leading-5 text-main-gray">
                            Сообщение будет удалено из этого геочата.
                        </div>
                    </div>

                    <button type="button" disabled={isDeleting} onClick={onClose} aria-label="Закрыть" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40">
                        <X className="size-4" />
                    </button>
                </div>

                <div className="mt-4 max-h-[120] overflow-hidden rounded-2xl bg-gray-50 px-3 py-2.5 text-sm leading-5 text-gray-700">
                    {target.content}
                </div>

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" disabled={isDeleting} onClick={onClose} className="h-10 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40">
                        Отмена
                    </button>

                    <button type="button" disabled={isDeleting} onClick={onConfirm} className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50">
                        {isDeleting ? (
                            <>
                                <RefreshCw className="size-4 animate-spin" />
                                <span>Удаляем...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-4" />
                                <span>Удалить</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default GeoChatDeleteDialog
