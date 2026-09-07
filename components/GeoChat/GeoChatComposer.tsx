"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import { CornerUpLeft, Paperclip, Pencil, Send, Smile, X } from "lucide-react"
import type { KeyboardEvent, RefObject } from "react"
import type { GeoChatAccessStatus } from "./GeoChatAccessWarning"

type Props = {
    content: string
    error: string
    isPending: boolean
    canSend: boolean
    accessStatus: GeoChatAccessStatus
    editingMessage: GeoChatMessage | null
    replyingTo: GeoChatMessage | null
    textareaRef: RefObject<HTMLTextAreaElement | null>
    onContentChange: (value: string) => void
    onSubmit: () => void
    onCancelEdit: () => void
    onCancelReply: () => void
    onFocus: () => void
}

function GeoChatComposer({ content, error, isPending, canSend, accessStatus, editingMessage, replyingTo, textareaRef, onContentChange, onSubmit, onCancelEdit, onCancelReply, onFocus }: Props) {
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape" && editingMessage) {
            event.preventDefault()
            onCancelEdit()
            return
        }

        if (event.key !== "Enter") return
        if (event.shiftKey) return

        event.preventDefault()
        onSubmit()
    }

    return (
        <div className="shrink-0 border-t border-gray-100 bg-white px-2 py-2 sm:p-4">
            {error && (
                <div className="mb-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
                    {error}
                </div>
            )}

            {editingMessage && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <Pencil className="size-4 shrink-0 text-main-green" />

                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-main-green">
                            Редактирование сообщения
                        </div>

                        <div className="mt-0.5 truncate text-xs text-main-gray">
                            {editingMessage.content}
                        </div>
                    </div>

                    <button type="button" onClick={onCancelEdit} aria-label="Отменить редактирование" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {!editingMessage && replyingTo && (
                <div className="mb-2 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <CornerUpLeft className="size-4 shrink-0 text-main-green" />

                    <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-main-green">
                            Ответ {replyingTo.authorDisplayName}
                        </div>

                        <div className="mt-0.5 truncate text-xs text-main-gray">
                            {replyingTo.content}
                        </div>
                    </div>

                    <button type="button" onClick={onCancelReply} aria-label="Отменить ответ" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            <div className="flex items-end gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 sm:gap-2 sm:p-2">
                <button type="button" disabled={!canSend || Boolean(editingMessage)} aria-label="Прикрепить файл" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                    <Paperclip className="size-4 sm:size-5" />
                </button>

                <button type="button" disabled={!canSend || Boolean(editingMessage)} aria-label="Эмодзи" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                    <Smile className="size-4 sm:size-5" />
                </button>

                <textarea ref={textareaRef} value={content} disabled={!canSend} onKeyDown={handleKeyDown} onFocus={onFocus} onChange={(event) => { onContentChange(event.target.value); event.currentTarget.style.height = "38px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 100); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 100 ? "auto" : "hidden" }} placeholder={canSend ? editingMessage ? "Изменить сообщение..." : replyingTo ? `Ответ ${replyingTo.authorDisplayName}...` : "Написать сообщение..." : accessStatus === "checking" ? "Проверяем местоположение..." : "Вы вне зоны геочата"} maxLength={4000} rows={1} className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2 text-sm leading-5.5 text-gray-900 outline-none placeholder:text-main-gray disabled:cursor-not-allowed disabled:opacity-50" />

                <button type="button" onClick={onSubmit} disabled={!canSend || isPending || !content.trim()} aria-label={editingMessage ? "Сохранить" : "Отправить"} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40 sm:size-10">
                    {editingMessage ? <Pencil className="size-4" /> : <Send className="size-4" />}
                </button>
            </div>
        </div>
    )
}

export default GeoChatComposer
