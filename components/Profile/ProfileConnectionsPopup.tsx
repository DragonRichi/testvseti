"use client"

import { getProfileConnections } from "@/actions/getProfileConnections"
import UserAvatar from "@/components/ui/UserAvatar"
import type { ProfileConnectionCursor, ProfileConnectionItem, ProfileConnectionType } from "@/types/follows"
import { LoaderCircle, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

type Props = {
    profileId: string
    type: ProfileConnectionType
    initialItems: ProfileConnectionItem[]
    initialNextCursor: ProfileConnectionCursor | null
    onClose: () => void
}

function ProfileConnectionsPopup({
    profileId,
    type,
    initialItems,
    initialNextCursor,
    onClose
}: Props) {
    const [isMounted, setIsMounted] = useState(false)
    const [items, setItems] = useState(initialItems)
    const [nextCursor, setNextCursor] = useState(initialNextCursor)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const loadingLockRef = useRef(false)

    const title = type === "followers" ? "Читатели" : "В читаемых"

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const previousBodyOverflow = document.body.style.overflow
        document.body.style.overflow = "hidden"

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = previousBodyOverflow
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [onClose])

    const loadMore = useCallback(async () => {
        if (!nextCursor || loadingLockRef.current) return

        loadingLockRef.current = true
        setIsLoading(true)
        setError("")

        try {
            const result = await getProfileConnections(
                profileId,
                type,
                nextCursor
            )

            if (result.success === false) {
                setError(result.error)
                return
            }

            setItems((current) => {
                const existingIds = new Set(
                    current.map((item) => item.id)
                )

                const newItems = result.items.filter(
                    (item) => !existingIds.has(item.id)
                )

                return [...current, ...newItems]
            })

            setNextCursor(result.nextCursor)
        } catch (error) {
            console.error(
                "PROFILE CONNECTIONS POPUP ERROR:",
                error
            )

            setError(
                "Не удалось загрузить пользователей"
            )
        } finally {
            loadingLockRef.current = false
            setIsLoading(false)
        }
    }, [
        nextCursor,
        profileId,
        type
    ])

    if (!isMounted) {
        return null
    }

    return createPortal(
        <div
            className="fixed inset-0 z-200 flex items-end justify-center bg-black/30 p-0 backdrop-blur-[3px] sm:items-center sm:p-5"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose()
                }
            }}
        >
            <div className="flex max-h-[78dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.20)] sm:max-h-[620] sm:max-w-[440] sm:rounded-3xl">
                <div className="flex h-[64] shrink-0 items-center justify-between border-b border-[#ededed] px-5">
                    <h2 className="text-[18px] font-bold text-[#171717]">
                        {title}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Закрыть"
                        className="flex size-9 cursor-pointer items-center justify-center rounded-full text-[#777777] transition-colors hover:bg-[#f2f2f2] hover:text-[#171717]"
                    >
                        <X
                            className="size-5"
                            strokeWidth={1.7}
                        />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                    {items.length === 0 ? (
                        <div className="flex min-h-[220] items-center justify-center px-6 text-center text-[14px] text-[#999999]">
                            {type === "followers"
                                ? "Читателей пока нет"
                                : "Пользователь пока никого не читает"}
                        </div>
                    ) : (
                        <div>
                            {items.map(
                                (item) => (
                                    <Link
                                        key={
                                            item.id
                                        }
                                        href={`/profile/${item.username}`}
                                        onClick={
                                            onClose
                                        }
                                        className="flex items-center gap-3 border-b border-[#f1f1f1] px-5 py-3 transition-colors last:border-b-0 hover:bg-[#fafafa]"
                                    >
                                        <UserAvatar
                                            userId={
                                                item.id
                                            }
                                            displayName={
                                                item.displayName
                                            }
                                            avatarUrl={
                                                item.avatarUrl
                                            }
                                            size={
                                                44
                                            }
                                        />

                                        <div className="min-w-0 flex-1">
                                            <div className="truncate text-[14px] font-semibold text-[#171717]">
                                                {
                                                    item.displayName
                                                }
                                            </div>

                                            <div className="mt-0.5 truncate text-[12px] text-[#999999]">
                                                @
                                                {
                                                    item.username
                                                }
                                            </div>
                                        </div>

                                        {item.isCurrentUser && (
                                            <span className="shrink-0 rounded-full bg-[#f2f2f2] px-2 py-1 text-[10px] font-medium text-[#777777]">
                                                Вы
                                            </span>
                                        )}
                                    </Link>
                                )
                            )}
                        </div>
                    )}

                    {error && (
                        <div className="px-5 py-3 text-center text-[12px] text-red-500">
                            {error}
                        </div>
                    )}

                    {nextCursor && (
                        <div className="p-4">
                            <button
                                type="button"
                                onClick={() =>
                                    void loadMore()
                                }
                                disabled={
                                    isLoading
                                }
                                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f4f4f4] text-[13px] font-medium text-[#555555] transition-colors hover:bg-[#ededed] disabled:cursor-default disabled:opacity-60"
                            >
                                {isLoading && (
                                    <LoaderCircle className="size-4 animate-spin" />
                                )}

                                {isLoading
                                    ? "Загружаем..."
                                    : "Показать ещё"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    )
}

export default ProfileConnectionsPopup