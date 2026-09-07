"use client"

import type { GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import { ArrowLeft, Hash, MoreHorizontal } from "lucide-react"
import Link from "next/link"

type Props = {
    room: GeoChatRoomType
    accuracy: number | null
    isAdminMode: boolean
}

function GeoChatHeader({ room, accuracy, isAdminMode }: Props) {
    return (
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 sm:h-16 sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
                <Link href="/geochats" aria-label="Назад к геочатам" className="flex size-8 shrink-0 items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-9">
                    <ArrowLeft className="size-5" />
                </Link>

                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-main-green sm:size-10">
                    <Hash className="size-5" />
                </div>

                <div className="min-w-0">
                    <div className="truncate text-[15px] font-bold text-gray-900 sm:text-lg">#{room.name}</div>

                    <div className="flex items-center gap-1.5 text-[11px] text-main-gray sm:text-xs">
                        <span>Радиус {Math.round(room.radiusM / 1000)} км</span>

                        {isAdminMode ? (
                            <span className="font-semibold text-main-green">· Администратор</span>
                        ) : accuracy !== null ? (
                            <span>· ±{Math.round(accuracy)} м</span>
                        ) : null}
                    </div>
                </div>
            </div>

            <button type="button" aria-label="Меню геочата" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-10">
                <MoreHorizontal className="size-5" />
            </button>
        </div>
    )
}

export default GeoChatHeader