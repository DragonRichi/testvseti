"use client"

import type { GeoChatRoom } from "@/types/geoChat"
import { CalendarDays, Hash, MapPin, X } from "lucide-react"
import { createPortal } from "react-dom"

type Props = {
    room: GeoChatRoom
    name: string
    description: string | null
    open: boolean
    onClose: () => void
}

function formatDate(
    value: string
) {
    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
            timeZone:
                "Europe/Minsk"
        }
    ).format(
        new Date(value)
    )
}

function GeoChatInfoDialog({
    room,
    name,
    description,
    open,
    onClose
}: Props) {
    if (
        !open ||
        typeof document ===
            "undefined"
    ) {
        return null
    }

    return createPortal(
        <div className="fixed inset-0 z-210 flex items-center justify-center bg-black/40 p-4" onPointerDown={onClose}>
            <div className="w-full max-w-[440] rounded-3xl bg-white p-5 shadow-xl sm:p-6" onPointerDown={(event) => event.stopPropagation()}>
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="text-lg font-bold text-gray-900">
                            О геочате
                        </div>

                        <div className="mt-1 text-sm text-main-gray">
                            Информация о территории общения
                        </div>
                    </div>

                    <button type="button" onClick={onClose} aria-label="Закрыть" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900">
                        <X className="size-5" />
                    </button>
                </div>

                <div className="mt-5 flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <Hash className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">
                            #{name}
                        </div>

                        <div className="mt-0.5 text-xs text-main-gray">
                            Геочат
                        </div>
                    </div>
                </div>

                {description && (
                    <div className="mt-5 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                        {description}
                    </div>
                )}

                <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                        <MapPin className="size-4 shrink-0 text-main-green" />
                        <span>
                            Радиус {Math.round(room.radiusM / 1000)} км
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-700">
                        <CalendarDays className="size-4 shrink-0 text-main-green" />
                        <span>
                            Создан {formatDate(room.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default GeoChatInfoDialog