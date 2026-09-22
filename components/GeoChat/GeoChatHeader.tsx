"use client"

import type { GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import {
    ArrowLeft,
    Check,
    Copy,
    Hash,
    Info,
    MoreHorizontal,
    Pencil,
    Trash2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    useEffect,
    useRef,
    useState
} from "react"
import GeoChatEditDialog from "./GeoChatEditDialog"
import GeoChatInfoDialog from "./GeoChatInfoDialog"
import GeoChatRoomDeleteDialog from "./GeoChatRoomDeleteDialog"

type Props = {
    room: GeoChatRoomType
    accuracy: number | null
    isAdminMode: boolean
    currentProfileId: string
}

function GeoChatHeader({
    room,
    accuracy,
    isAdminMode,
    currentProfileId
}: Props) {
    const router = useRouter()

    const [menuOpen, setMenuOpen] =
        useState(false)

    const [infoOpen, setInfoOpen] =
        useState(false)

    const [editOpen, setEditOpen] =
        useState(false)

    const [
        deleteOpen,
        setDeleteOpen
    ] = useState(false)

    const [copied, setCopied] =
        useState(false)

    const [roomName, setRoomName] =
        useState(room.name)

    const [
        roomDescription,
        setRoomDescription
    ] = useState(
        room.description
    )

    const menuRef =
        useRef<HTMLDivElement>(null)

    const canManage =
        isAdminMode ||
        room.creatorId ===
        currentProfileId

    useEffect(() => {
        if (!menuOpen) return

        const handlePointerDown = (
            event: PointerEvent
        ) => {
            if (
                menuRef.current?.contains(
                    event.target as Node
                )
            ) {
                return
            }

            setMenuOpen(false)
        }

        const handleKeyDown = (
            event: KeyboardEvent
        ) => {
            if (
                event.key ===
                "Escape"
            ) {
                setMenuOpen(false)
            }
        }

        document.addEventListener(
            "pointerdown",
            handlePointerDown
        )

        document.addEventListener(
            "keydown",
            handleKeyDown
        )

        return () => {
            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            )

            document.removeEventListener(
                "keydown",
                handleKeyDown
            )
        }
    }, [menuOpen])

    const copyLink = async () => {
        try {
            const url =
                `${window.location.origin}/geochats/${room.id}`

            await navigator.clipboard.writeText(
                url
            )

            setCopied(true)

            window.setTimeout(
                () =>
                    setCopied(
                        false
                    ),
                1600
            )
        } catch (error) {
            console.error(
                "GEO CHAT COPY LINK ERROR:",
                error
            )
        }
    }

    return (
        <>
            <div className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 bg-white px-3 sm:h-16 sm:px-5">
                <div className="flex min-w-0 items-center gap-2.5">
                    <Link href="/geochats" aria-label="Назад к геочатам" className="flex size-8 shrink-0 items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-9">
                        <ArrowLeft className="size-5" />
                    </Link>

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-green-50 text-main-green sm:size-10">
                        <Hash className="size-5" />
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-[15px] font-bold text-gray-900 sm:text-lg">
                            #{roomName}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-main-gray sm:text-xs">
                            <span>
                                Радиус{" "}
                                {Math.round(
                                    room.radiusM /
                                    1000
                                )}{" "}
                                км
                            </span>

                            {isAdminMode ? (
                                <span className="font-medium text-main-green">
                                    · Администратор
                                </span>
                            ) : accuracy !==
                                null ? (
                                <span>
                                    · ±
                                    {Math.round(
                                        accuracy
                                    )}{" "}
                                    м
                                </span>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div
                    ref={menuRef}
                    className="relative shrink-0"
                >
                    <button
                        type="button"
                        aria-label="Меню геочата"
                        aria-expanded={
                            menuOpen
                        }
                        onClick={() =>
                            setMenuOpen(
                                (current) =>
                                    !current
                            )
                        }
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100 hover:text-gray-900 sm:size-10"
                    >
                        <MoreHorizontal className="size-5" />
                    </button>

                    {menuOpen && (
                        <div className="absolute right-0 top-full z-50 mt-1.5 w-[220] overflow-hidden rounded-2xl border border-gray-100 bg-white py-1.5 shadow-xl">
                            <button
                                type="button"
                                onClick={() => {
                                    setMenuOpen(
                                        false
                                    )
                                    setInfoOpen(
                                        true
                                    )
                                }}
                                className="flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
                            >
                                <Info className="size-4 text-main-gray" />
                                О геочате
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    void copyLink()
                                }
                                className="flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
                            >
                                {copied ? (
                                    <Check className="size-4 text-main-green" />
                                ) : (
                                    <Copy className="size-4 text-main-gray" />
                                )}

                                {copied
                                    ? "Ссылка скопирована"
                                    : "Скопировать ссылку"}
                            </button>

                            {canManage && (
                                <>
                                    <div className="mx-3 my-1 border-t border-gray-100" />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(
                                                false
                                            )
                                            setEditOpen(
                                                true
                                            )
                                        }}
                                        className="flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm text-gray-800 transition-colors hover:bg-gray-50"
                                    >
                                        <Pencil className="size-4 text-main-gray" />
                                        Редактировать
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMenuOpen(
                                                false
                                            )
                                            setDeleteOpen(
                                                true
                                            )
                                        }}
                                        className="flex h-10 w-full cursor-pointer items-center gap-3 px-3 text-left text-sm text-red-500 transition-colors hover:bg-red-50"
                                    >
                                        <Trash2 className="size-4" />
                                        Удалить геочат
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <GeoChatInfoDialog
                room={room}
                name={roomName}
                description={
                    roomDescription
                }
                open={infoOpen}
                onClose={() =>
                    setInfoOpen(false)
                }
            />

            {canManage && (
                <>
                    <GeoChatEditDialog
                        roomId={room.id}
                        currentName={
                            roomName
                        }
                        currentDescription={
                            roomDescription
                        }
                        open={editOpen}
                        onClose={() =>
                            setEditOpen(
                                false
                            )
                        }
                        onUpdated={(
                            name,
                            description
                        ) => {
                            setRoomName(
                                name
                            )

                            setRoomDescription(
                                description
                            )

                            router.refresh()
                        }}
                    />

                    <GeoChatRoomDeleteDialog
                        roomId={room.id}
                        roomName={
                            roomName
                        }
                        open={
                            deleteOpen
                        }
                        onClose={() =>
                            setDeleteOpen(
                                false
                            )
                        }
                        onDeleted={() => {
                            router.replace(
                                "/geochats"
                            )

                            router.refresh()
                        }}
                    />
                </>
            )}
        </>
    )
}

export default GeoChatHeader