"use client"

import { updateGeoChatRoom } from "@/actions/updateGeoChatRoom"
import { LoaderCircle, X } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
    roomId: string
    currentName: string
    currentDescription: string | null
    open: boolean
    onClose: () => void
    onUpdated: (
        name: string,
        description: string | null
    ) => void
}

function GeoChatEditDialog({
    roomId,
    currentName,
    currentDescription,
    open,
    onClose,
    onUpdated
}: Props) {
    const [name, setName] =
        useState(currentName)

    const [
        description,
        setDescription
    ] = useState(
        currentDescription ?? ""
    )

    const [error, setError] =
        useState("")

    const [
        isPending,
        setIsPending
    ] = useState(false)

    useEffect(() => {
        if (!open) return

        setName(currentName)
        setDescription(
            currentDescription ??
                ""
        )

        setError("")
    }, [
        currentDescription,
        currentName,
        open
    ])

    if (
        !open ||
        typeof document ===
            "undefined"
    ) {
        return null
    }

    const handleSave =
        async () => {
            if (isPending) return

            setIsPending(true)
            setError("")

            try {
                const result =
                    await updateGeoChatRoom(
                        roomId,
                        name,
                        description
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

                onUpdated(
                    result.room.name,
                    result.room
                        .description
                )

                onClose()
            } catch (error) {
                console.error(
                    "GEO CHAT EDIT ERROR:",
                    error
                )

                setError(
                    "Не удалось изменить геочат"
                )
            } finally {
                setIsPending(false)
            }
        }

    return createPortal(
        <div className="fixed inset-0 z-210 flex items-center justify-center bg-black/40 p-4" onPointerDown={() => { if (!isPending) onClose() }}>
            <div className="w-full max-w-[460] rounded-3xl bg-white p-5 shadow-xl sm:p-6" onPointerDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-bold text-gray-900">
                            Редактировать геочат
                        </div>

                        <div className="mt-1 text-xs leading-5 text-main-gray">
                            Радиус и центр геочата остаются без изменений.
                        </div>
                    </div>

                    <button type="button" disabled={isPending} onClick={onClose} aria-label="Закрыть" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-50">
                        <X className="size-5" />
                    </button>
                </div>

                <label className="mt-5 block text-sm font-semibold text-gray-900">
                    Название
                </label>

                <input
                    value={name}
                    maxLength={80}
                    disabled={isPending}
                    onChange={(event) => {
                        setName(event.target.value)
                        setError("")
                    }}
                    className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-3 text-[16px] text-gray-900 outline-none transition-colors focus:border-main-green lg:text-sm"
                />

                <div className="mt-4 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">
                        Описание
                    </label>

                    <span className="text-xs text-main-gray">
                        {description.length}/500
                    </span>
                </div>

                <textarea
                    value={description}
                    maxLength={500}
                    disabled={isPending}
                    onChange={(event) => {
                        setDescription(event.target.value)
                        setError("")
                    }}
                    placeholder="Описание геочата"
                    className="mt-2 min-h-[110] w-full resize-none rounded-xl border border-gray-200 px-3 py-3 text-[16px] leading-6 text-gray-900 outline-none transition-colors focus:border-main-green lg:text-sm"
                />

                {error && (
                    <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" disabled={isPending} onClick={onClose} className="h-10 cursor-pointer rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50">
                        Отмена
                    </button>

                    <button type="button" disabled={isPending || !name.trim()} onClick={() => void handleSave()} className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-50">
                        {isPending && (
                            <LoaderCircle className="size-4 animate-spin" />
                        )}

                        Сохранить
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default GeoChatEditDialog