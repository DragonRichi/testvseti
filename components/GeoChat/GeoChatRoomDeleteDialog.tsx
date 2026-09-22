"use client"

import { deleteGeoChatRoom } from "@/actions/deleteGeoChatRoom"
import { LoaderCircle, Trash2, X } from "lucide-react"
import { useState } from "react"
import { createPortal } from "react-dom"

type Props = {
    roomId: string
    roomName: string
    open: boolean
    onClose: () => void
    onDeleted: () => void
}

function GeoChatRoomDeleteDialog({
    roomId,
    roomName,
    open,
    onClose,
    onDeleted
}: Props) {
    const [
        isDeleting,
        setIsDeleting
    ] = useState(false)

    const [error, setError] =
        useState("")

    if (
        !open ||
        typeof document ===
            "undefined"
    ) {
        return null
    }

    const handleDelete =
        async () => {
            if (isDeleting) return

            setIsDeleting(true)
            setError("")

            try {
                const result =
                    await deleteGeoChatRoom(
                        roomId
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(
                        result.error
                    )

                    return
                }

                onDeleted()
            } catch (error) {
                console.error(
                    "GEO CHAT ROOM DELETE ERROR:",
                    error
                )

                setError(
                    "Не удалось удалить геочат"
                )
            } finally {
                setIsDeleting(false)
            }
        }

    return createPortal(
        <div className="fixed inset-0 z-220 flex items-center justify-center bg-black/40 p-4" onPointerDown={() => { if (!isDeleting) onClose() }}>
            <div className="w-full max-w-[420] rounded-3xl bg-white p-5 shadow-xl sm:p-6" onPointerDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <Trash2 className="size-5" />
                    </div>

                    <button type="button" disabled={isDeleting} onClick={onClose} aria-label="Закрыть" className="flex size-9 cursor-pointer items-center justify-center rounded-full text-main-gray hover:bg-gray-100 disabled:pointer-events-none">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mt-4 text-lg font-bold text-gray-900">
                    Удалить геочат?
                </div>

                <div className="mt-2 text-sm leading-6 text-main-gray">
                    Геочат «{roomName}» и вся его история сообщений будут удалены без возможности восстановления.
                </div>

                {error && (
                    <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" disabled={isDeleting} onClick={onClose} className="h-10 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                        Отмена
                    </button>

                    <button type="button" disabled={isDeleting} onClick={() => void handleDelete()} className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:pointer-events-none disabled:opacity-50">
                        {isDeleting && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}

                        Удалить
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default GeoChatRoomDeleteDialog