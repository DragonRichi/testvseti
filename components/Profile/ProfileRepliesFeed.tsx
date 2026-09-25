"use client"

import { loadMoreProfileReplies } from "@/actions/loadMoreProfileReplies"
import type { ProfileRepliesCursor, ProfileReplyItem } from "@/types/profileContent"
import type { Profile } from "@/types/social"
import { LoaderCircle, MessageCircleReply } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import ProfileReplyCard from "./ProfileReplyCard"

type Props = {
    profile: Profile
    initialItems: ProfileReplyItem[]
    initialCursor: ProfileRepliesCursor | null
}

function ProfileRepliesFeed({
    profile,
    initialItems,
    initialCursor
}: Props) {
    const [
        items,
        setItems
    ] =
        useState<ProfileReplyItem[]>(
            initialItems
        )

    const [
        cursor,
        setCursor
    ] =
        useState<ProfileRepliesCursor | null>(
            initialCursor
        )

    const [
        isLoading,
        setIsLoading
    ] = useState(false)

    const [
        error,
        setError
    ] = useState("")

    const lockRef =
        useRef(false)

    const version =
        useMemo(
            () =>
                `${profile.id}:${initialItems.map((item) => item.id).join("|")}:${JSON.stringify(initialCursor)}`,
            [
                profile.id,
                initialItems,
                initialCursor
            ]
        )

    const appliedVersion =
        useRef(version)

    useEffect(() => {
        if (
            appliedVersion.current ===
            version
        ) {
            return
        }

        appliedVersion.current =
            version

        setItems(
            initialItems
        )

        setCursor(
            initialCursor
        )

        setError("")
        setIsLoading(false)
        lockRef.current = false
    }, [
        version,
        initialItems,
        initialCursor
    ])

    const handleLoadMore =
        async () => {
            if (
                lockRef.current ||
                !cursor
            ) {
                return
            }

            lockRef.current =
                true

            setIsLoading(true)
            setError("")

            try {
                const result =
                    await loadMoreProfileReplies(
                        profile.id,
                        cursor
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

                setItems(
                    (current) => {
                        const ids =
                            new Set(
                                current.map(
                                    (
                                        item
                                    ) =>
                                        item.id
                                )
                            )

                        return [
                            ...current,
                            ...result.items.filter(
                                (
                                    item
                                ) =>
                                    !ids.has(
                                        item.id
                                    )
                            )
                        ]
                    }
                )

                setCursor(
                    result.nextCursor
                )
            } catch (error) {
                console.error(
                    "PROFILE REPLIES LOAD ERROR:",
                    error
                )

                setError(
                    "Не удалось загрузить ответы"
                )
            } finally {
                lockRef.current =
                    false

                setIsLoading(
                    false
                )
            }
        }

    if (
        items.length === 0 &&
        !cursor
    ) {
        return (
            <div className="flex min-h-[280] flex-col items-center justify-center bg-white px-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-full bg-[#edf9ee]">
                    <MessageCircleReply className="size-6 text-main-green" />
                </div>

                <div className="mt-4 text-[16px] font-semibold text-[#171717]">
                    Ответов пока нет
                </div>

                <div className="mt-2 text-[13px] text-[#999]">
                    Ответы пользователя в обсуждениях будут отображаться здесь.
                </div>
            </div>
        )
    }

    return (
        <div>
            {items.map(
                (item) => (
                    <ProfileReplyCard
                        key={
                            item.id
                        }
                        profile={
                            profile
                        }
                        item={item}
                    />
                )
            )}

            {error && (
                <div className="border-b border-[#e5e5e5] bg-white px-4 py-4 text-center text-sm text-red-500">
                    {error}
                </div>
            )}

            {cursor && (
                <div className="border-b border-[#e5e5e5] bg-white p-4">
                    <button
                        type="button"
                        disabled={
                            isLoading
                        }
                        onClick={() =>
                            void handleLoadMore()
                        }
                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#f5f5f5] text-[13px] font-medium text-[#616161] transition-colors hover:bg-[#eeeeee] disabled:pointer-events-none disabled:opacity-60"
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
    )
}

export default ProfileRepliesFeed