"use client"

import { getDirectConversations } from "@/actions/getDirectConversations"
import { createClient } from "@/lib/supabase/client"
import type { DirectConversationSummary } from "@/types/directMessages"
import {
    MessageCircle,
    Pin,
    Search
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react"

type Props = {
    initialConversations: DirectConversationSummary[]
    currentProfileId: string
}

function formatListTime(
    value: string | null
) {
    if (!value) return ""

    const date =
        new Date(value)

    const now =
        new Date()

    const sameDay =
        date.getFullYear() ===
        now.getFullYear() &&
        date.getMonth() ===
        now.getMonth() &&
        date.getDate() ===
        now.getDate()

    return new Intl.DateTimeFormat(
        "ru-RU",
        sameDay
            ? {
                hour: "2-digit",
                minute: "2-digit"
            }
            : {
                day: "2-digit",
                month: "2-digit"
            }
    ).format(date)
}

function DirectConversationList({
    initialConversations,
    currentProfileId
}: Props) {
    const [
        conversations,
        setConversations
    ] =
        useState(
            initialConversations
        )

    const [
        query,
        setQuery
    ] =
        useState("")

    const syncTimerRef =
        useRef<number | null>(
            null
        )

    useEffect(() => {
        const supabase =
            createClient()

        let disposed =
            false

        let channel:
            ReturnType<
                typeof supabase.channel
            > | null =
            null

        const sync =
            async () => {
                const next =
                    await getDirectConversations()

                if (!disposed) {
                    setConversations(
                        next
                    )
                }
            }

        const scheduleSync =
            () => {
                if (
                    syncTimerRef.current !==
                    null
                ) {
                    window.clearTimeout(
                        syncTimerRef.current
                    )
                }

                syncTimerRef.current =
                    window.setTimeout(
                        () =>
                            void sync(),
                        120
                    )
            }

        const connect =
            async () => {
                const {
                    data: {
                        session
                    }
                } =
                    await supabase.auth.getSession()

                if (
                    disposed ||
                    !session
                ) {
                    return
                }

                supabase.realtime.setAuth(
                    session.access_token
                )

                channel =
                    supabase
                        .channel(
                            `direct-conversations:${currentProfileId}`
                        )
                        .on(
                            "postgres_changes",
                            {
                                event:
                                    "*",
                                schema:
                                    "public",
                                table:
                                    "messages"
                            },
                            scheduleSync
                        )
                        .subscribe()
            }

        void connect()
        void sync()

        const handleFocus =
            () =>
                void sync()

        window.addEventListener(
            "focus",
            handleFocus
        )

        return () => {
            disposed = true

            window.removeEventListener(
                "focus",
                handleFocus
            )

            if (
                syncTimerRef.current !==
                null
            ) {
                window.clearTimeout(
                    syncTimerRef.current
                )
            }

            if (channel) {
                void supabase.removeChannel(
                    channel
                )
            }
        }
    }, [currentProfileId])

    const filtered =
        useMemo(() => {
            const normalized =
                query
                    .trim()
                    .toLocaleLowerCase(
                        "ru-RU"
                    )

            if (!normalized) {
                return conversations
            }

            return conversations.filter(
                (conversation) =>
                    conversation
                        .displayName
                        .toLocaleLowerCase(
                            "ru-RU"
                        )
                        .includes(
                            normalized
                        ) ||
                    conversation
                        .username
                        .toLocaleLowerCase(
                            "ru-RU"
                        )
                        .includes(
                            normalized
                        )
            )
        }, [
            conversations,
            query
        ])

    return (
        <section className="overflow-hidden rounded-3xl border border-green-100 bg-white">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h1 className="text-xl font-bold text-gray-900">
                    Сообщения
                </h1>

                <label className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-main-green focus-within:bg-white">
                    <Search className="size-4 shrink-0 text-main-gray" />

                    <input
                        value={
                            query
                        }
                        onChange={(
                            event
                        ) =>
                            setQuery(
                                event
                                    .target
                                    .value
                            )
                        }
                        placeholder="Поиск диалогов"
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-gray-900 outline-none placeholder:text-main-gray lg:text-sm"
                    />
                </label>
            </div>

            {filtered.length ===
                0 ? (
                <div className="flex min-h-[360] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <MessageCircle className="size-6" />
                    </div>

                    <div className="mt-4 font-semibold text-gray-900">
                        {query.trim()
                            ? "Диалоги не найдены"
                            : "Пока нет сообщений"}
                    </div>

                    <div className="mt-1 max-w-[360] text-sm leading-6 text-main-gray">
                        {query.trim()
                            ? "Попробуйте изменить запрос."
                            : "Откройте профиль пользователя и нажмите «Написать», чтобы начать переписку."}
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {filtered.map(
                        (
                            conversation
                        ) => {
                            const isOwnLastMessage =
                                conversation.lastMessageUserId ===
                                currentProfileId

                            return (
                                <Link
                                    href={`/messages/${conversation.id}`}
                                    key={
                                        conversation.id
                                    }
                                    className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-green-50/60 sm:px-5 sm:py-4"
                                >
                                    <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-bg-green sm:size-[52]">
                                        <Image
                                            src={
                                                conversation.avatarUrl ??
                                                "/user-avatar.svg"
                                            }
                                            alt={
                                                conversation.displayName
                                            }
                                            fill
                                            sizes="52px"
                                            unoptimized={
                                                process.env
                                                    .NODE_ENV ===
                                                "development"
                                            }
                                            className="object-cover"
                                        />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-bold text-gray-950" : "font-semibold text-gray-900"}`}>
                                                {
                                                    conversation.displayName
                                                }
                                            </div>

                                            {conversation.isPinned && (
                                                <Pin className="size-3.5 shrink-0 text-main-gray" />
                                            )}

                                            <div className="ml-auto shrink-0 text-[11px] text-main-gray">
                                                {formatListTime(
                                                    conversation.lastMessageTime
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-1 flex min-w-0 items-center gap-2">
                                            <div className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount > 0 ? "font-medium text-gray-700" : "text-main-gray"}`}>
                                                {isOwnLastMessage && (
                                                    <span>
                                                        Вы:{" "}
                                                    </span>
                                                )}

                                                {conversation.lastMessage ||
                                                    "Сообщение"}
                                            </div>

                                            {conversation.unreadCount >
                                                0 && (
                                                    <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-main-green px-1.5 text-[11px] font-bold text-white">
                                                        {conversation.unreadCount >
                                                            99
                                                            ? "99+"
                                                            : conversation.unreadCount}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        }
                    )}
                </div>
            )}
        </section>
    )
}

export default DirectConversationList