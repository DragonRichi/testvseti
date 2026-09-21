"use client"

import type { GeoChatMessage } from "@/types/geoChat"
import {
    GEO_CHAT_ALLOWED_MIME_TYPES,
    GEO_CHAT_MAX_ATTACHMENTS,
    GEO_CHAT_MAX_FILE_SIZE
} from "@/lib/geochats/uploadGeoChatMedia"
import { CornerUpLeft, Paperclip, Pencil, Send, Smile, X } from "lucide-react"
import Image from "next/image"
import type { ChangeEvent, KeyboardEvent, RefObject } from "react"
import { useEffect, useRef, useState } from "react"
import type { GeoChatAccessStatus } from "./GeoChatAccessWarning"

type SelectedImage = {
    file: File
    previewUrl: string
}

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
    onSubmit: (files: File[]) => Promise<boolean>
    onCancelEdit: () => void
    onCancelReply: () => void
    onFocus: () => void
    onError: (message: string) => void
}

function GeoChatComposer({
    content,
    error,
    isPending,
    canSend,
    accessStatus,
    editingMessage,
    replyingTo,
    textareaRef,
    onContentChange,
    onSubmit,
    onCancelEdit,
    onCancelReply,
    onFocus,
    onError
}: Props) {
    const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)

    const clearImages = () => {
        setSelectedImages((current) => {
            current.forEach((image) => {
                URL.revokeObjectURL(image.previewUrl)
            })

            return []
        })

        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    useEffect(() => {
        if (!editingMessage) return
        clearImages()
    }, [editingMessage])

    useEffect(() => {
        return () => {
            selectedImages.forEach((image) => {
                URL.revokeObjectURL(image.previewUrl)
            })
        }
    }, [selectedImages])

    const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files ?? [])

        event.target.value = ""

        if (files.length === 0) return

        if (selectedImages.length + files.length > GEO_CHAT_MAX_ATTACHMENTS) {
            onError(`Можно прикрепить не более ${GEO_CHAT_MAX_ATTACHMENTS} изображений`)
            return
        }

        for (const file of files) {
            if (!GEO_CHAT_ALLOWED_MIME_TYPES.includes(file.type)) {
                onError(`Файл "${file.name}" не является поддерживаемым изображением`)
                return
            }

            if (file.size <= 0) {
                onError(`Файл "${file.name}" пуст`)
                return
            }

            if (file.size > GEO_CHAT_MAX_FILE_SIZE) {
                onError(`Изображение "${file.name}" превышает 10 МБ`)
                return
            }
        }

        const newImages = files.map((file) => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }))

        setSelectedImages((current) => [
            ...current,
            ...newImages
        ])
    }

    const removeImage = (index: number) => {
        if (isPending) return

        setSelectedImages((current) => {
            const target = current[index]

            if (target) {
                URL.revokeObjectURL(target.previewUrl)
            }

            return current.filter((_, itemIndex) => itemIndex !== index)
        })
    }

    const submit = async () => {
        if (isPending) return

        if (!content.trim() && selectedImages.length === 0) {
            return
        }

        const success = await onSubmit(
            selectedImages.map((image) => image.file)
        )

        if (success) {
            clearImages()
        }
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === "Escape" && editingMessage) {
            event.preventDefault()
            onCancelEdit()
            return
        }

        if (event.key !== "Enter") return
        if (event.shiftKey) return

        event.preventDefault()
        void submit()
    }

    const canSubmit =
        canSend &&
        !isPending &&
        (
            content.trim().length > 0 ||
            (
                !editingMessage &&
                selectedImages.length > 0
            )
        )

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
                            {replyingTo.content || "Изображение"}
                        </div>
                    </div>

                    <button type="button" onClick={onCancelReply} aria-label="Отменить ответ" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-gray-900">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            {selectedImages.length > 0 && !editingMessage && (
                <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
                    {selectedImages.map((image, index) => (
                        <div key={`${image.file.name}-${image.file.size}-${index}`} className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 sm:size-24">
                            <Image src={image.previewUrl} alt={image.file.name} fill unoptimized sizes="96px" className="object-cover" />

                            <button type="button" disabled={isPending} onClick={() => removeImage(index)} aria-label="Удалить изображение" className="absolute right-1 top-1 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden onChange={handleFilesChange} />

            <div className="flex items-end gap-1 rounded-2xl border border-gray-200 bg-white p-1.5 sm:gap-2 sm:p-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!canSend || isPending || Boolean(editingMessage) || selectedImages.length >= GEO_CHAT_MAX_ATTACHMENTS} aria-label="Прикрепить изображение" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                    <Paperclip className="size-4 sm:size-5" />
                </button>

                <button type="button" disabled={!canSend || Boolean(editingMessage)} aria-label="Эмодзи" className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-40 sm:size-9">
                    <Smile className="size-4 sm:size-5" />
                </button>

                <textarea ref={textareaRef} value={content} disabled={!canSend} onKeyDown={handleKeyDown} onFocus={onFocus} onChange={(event) => { onContentChange(event.target.value); event.currentTarget.style.height = "38px"; const nextHeight = Math.min(event.currentTarget.scrollHeight, 100); event.currentTarget.style.height = `${nextHeight}px`; event.currentTarget.style.overflowY = event.currentTarget.scrollHeight > 100 ? "auto" : "hidden" }} placeholder={canSend ? editingMessage ? "Изменить сообщение..." : replyingTo ? `Ответ ${replyingTo.authorDisplayName}...` : "Написать сообщение..." : accessStatus === "checking" ? "Проверяем местоположение..." : "Вы вне зоны геочата"} maxLength={4000} rows={1} className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-1 py-2 text-sm leading-5.5 text-gray-900 outline-none placeholder:text-main-gray disabled:cursor-not-allowed disabled:opacity-50" />

                <button type="button" onClick={() => void submit()} disabled={!canSubmit} aria-label={editingMessage ? "Сохранить" : "Отправить"} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40 sm:size-10">
                    {editingMessage ? <Pencil className="size-4" /> : <Send className="size-4" />}
                </button>
            </div>
        </div>
    )
}

export default GeoChatComposer