"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import { Copy, CornerUpLeft, Pencil, Trash2 } from "lucide-react"
import type { RefObject } from "react"
import { createPortal } from "react-dom"

export type GeoChatMessageMenuPosition = {
    top: number
    left: number
}

type Props = {
    message: GeoChatMessage | null
    position: GeoChatMessageMenuPosition | null
    menuRef: RefObject<HTMLDivElement | null>
    currentProfileId: string
    canSend: boolean
    onReply: (message: GeoChatMessage) => void
    onCopy: (message: GeoChatMessage) => void
    onEdit: (message: GeoChatMessage) => void
    onDelete: (message: GeoChatMessage) => void
}

function GeoChatMessageMenu({ message, position, menuRef, currentProfileId, canSend, onReply, onCopy, onEdit, onDelete }: Props) {
    if (typeof document === "undefined" || !message || !position) return null

    return createPortal(
        <div ref={menuRef} onPointerDown={(event) => event.stopPropagation()} className="fixed z-[10000] w-[170] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-xl" style={{ top: position.top, left: position.left }}>
            <button type="button" disabled={!canSend} onClick={() => onReply(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40">
                <CornerUpLeft className="size-4 text-main-gray" />
                <span>Ответить</span>
            </button>

            <button type="button" onClick={() => onCopy(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50">
                <Copy className="size-4 text-main-gray" />
                <span>Копировать</span>
            </button>

            {message.userId === currentProfileId && (
                <>
                    <div className="mx-3 border-t border-gray-100" />

                    <button type="button" disabled={!canSend} onClick={() => onEdit(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40">
                        <Pencil className="size-4 text-main-gray" />
                        <span>Изменить</span>
                    </button>

                    <button type="button" disabled={!canSend} onClick={() => onDelete(message)} className="flex h-10 w-full cursor-pointer items-center gap-2.5 px-3 text-left text-sm text-red-500 transition-colors hover:bg-red-50 disabled:pointer-events-none disabled:opacity-40">
                        <Trash2 className="size-4" />
                        <span>Удалить</span>
                    </button>
                </>
            )}
        </div>,
        document.body
    )
}

export default GeoChatMessageMenu
