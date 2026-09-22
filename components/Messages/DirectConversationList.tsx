"use client"

import {
    searchDirectMessages,
    type DirectMessageSearchMatch
} from "@/actions/searchDirectMessages"
import UserAvatar from "@/components/ui/UserAvatar"
import type { DirectConversationSummary } from "@/types/directMessages"
import {
    LoaderCircle,
    MessageCircle,
    Pin,
    Search
} from "lucide-react"
import Link from "next/link"
import {
    useEffect,
    useMemo,
    useState
} from "react"
import {
    formatConversationTime
} from "./directConversationListHelpers"
import useDirectConversationListRealtime from "./useDirectConversationListRealtime"

type Props = {
    initialConversations: DirectConversationSummary[]
    currentProfileId: string
}

type DisplayConversation = {
    conversation: DirectConversationSummary
    preview: string
    previewUserId: string | null
    previewTime: string | null
    isMessageMatch: boolean
}

function DirectConversationList({
    initialConversations,
    currentProfileId
}: Props) {
    const [query, setQuery] =
        useState("")

    const [
        messageMatches,
        setMessageMatches
    ] =
        useState<DirectMessageSearchMatch[]>([])

    const [
        isSearchingMessages,
        setIsSearchingMessages
    ] =
        useState(false)

    const conversations =
        useDirectConversationListRealtime({
            initialConversations,
            currentProfileId
        })

    useEffect(() => {
        const normalizedQuery =
            query.trim()

        if (
            normalizedQuery.length < 2
        ) {
            setMessageMatches([])
            setIsSearchingMessages(false)
            return
        }

        let cancelled = false

        setIsSearchingMessages(true)

        const timer =
            window.setTimeout(
                async () => {
                    try {
                        const matches =
                            await searchDirectMessages(
                                normalizedQuery
                            )

                        if (cancelled) {
                            return
                        }

                        setMessageMatches(
                            matches
                        )
                    } catch (error) {
                        if (cancelled) {
                            return
                        }

                        console.error(
                            "DIRECT MESSAGE SEARCH ERROR:",
                            error
                        )

                        setMessageMatches([])
                    } finally {
                        if (
                            !cancelled
                        ) {
                            setIsSearchingMessages(
                                false
                            )
                        }
                    }
                },
                300
            )

        return () => {
            cancelled = true

            window.clearTimeout(
                timer
            )
        }
    }, [query])

    const filtered =
        useMemo<DisplayConversation[]>(
            () => {
                const normalized =
                    query
                        .trim()
                        .toLocaleLowerCase(
                            "ru-RU"
                        )

                if (!normalized) {
                    return conversations.map(
                        (conversation) => ({
                            conversation,
                            preview:
                                conversation.lastMessage ||
                                "Сообщение",
                            previewUserId:
                                conversation.lastMessageUserId,
                            previewTime:
                                conversation.lastMessageTime,
                            isMessageMatch:
                                false
                        })
                    )
                }

                const matchesByConversation =
                    new Map<
                        string,
                        DirectMessageSearchMatch
                    >()

                for (
                    const match of
                    messageMatches
                ) {
                    if (
                        !matchesByConversation.has(
                            match.conversationId
                        )
                    ) {
                        matchesByConversation.set(
                            match.conversationId,
                            match
                        )
                    }
                }

                const result:
                    DisplayConversation[] =
                    []

                for (
                    const conversation of
                    conversations
                ) {
                    const nameMatches =
                        conversation.displayName
                            .toLocaleLowerCase(
                                "ru-RU"
                            )
                            .includes(
                                normalized
                            ) ||
                        conversation.username
                            .toLocaleLowerCase(
                                "ru-RU"
                            )
                            .includes(
                                normalized
                            )

                    const messageMatch =
                        matchesByConversation.get(
                            conversation.id
                        )

                    if (
                        !nameMatches &&
                        !messageMatch
                    ) {
                        continue
                    }

                    result.push({
                        conversation,
                        preview:
                            messageMatch?.content ??
                            conversation.lastMessage ??
                            "Сообщение",
                        previewUserId:
                            messageMatch
                                ?.messageUserId ??
                            conversation.lastMessageUserId,
                        previewTime:
                            messageMatch
                                ?.createdAt ??
                            conversation.lastMessageTime,
                        isMessageMatch:
                            Boolean(
                                messageMatch
                            )
                    })
                }

                return result
            },
            [
                conversations,
                messageMatches,
                query
            ]
        )

    return (
        <section className="overflow-hidden rounded-3xl border border-green-100 bg-white">
            <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <h1 className="text-xl font-bold text-gray-900">
                    Сообщения
                </h1>

                <label className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 transition-colors focus-within:border-main-green focus-within:bg-white">
                    <Search className="size-4 shrink-0 text-main-gray" />

                    <input
                        value={query}
                        onChange={(event) =>
                            setQuery(
                                event.target.value
                            )
                        }
                        placeholder="Поиск по диалогам и сообщениям"
                        className="min-w-0 flex-1 bg-transparent text-[16px] text-gray-900 outline-none placeholder:text-main-gray lg:text-sm"
                    />

                    {isSearchingMessages && (
                        <LoaderCircle className="size-4 shrink-0 animate-spin text-main-gray" />
                    )}
                </label>
            </div>

            {filtered.length === 0 ? (
                <div className="flex min-h-[360] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                        <MessageCircle className="size-6" />
                    </div>

                    <div className="mt-4 font-semibold text-gray-900">
                        {query.trim()
                            ? "Ничего не найдено"
                            : "Пока нет сообщений"}
                    </div>

                    <div className="mt-1 max-w-[360] text-sm leading-6 text-main-gray">
                        {query.trim()
                            ? "Попробуйте изменить поисковый запрос."
                            : "Откройте профиль пользователя и нажмите «Написать», чтобы начать переписку."}
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {filtered.map(
                        ({
                            conversation,
                            preview,
                            previewUserId,
                            previewTime,
                            isMessageMatch
                        }) => {
                            const isOwnPreview =
                                previewUserId ===
                                currentProfileId

                            return (
                                <Link
                                    href={`/messages/${conversation.id}`}
                                    key={conversation.id}
                                    className={`relative flex min-w-0 items-center gap-3 px-4 py-3 transition-colors sm:px-5 sm:py-4 ${conversation.unreadCount > 0 ? "bg-green-50/80 hover:bg-green-50" : "hover:bg-green-50/60"}`}
                                >
                                    {conversation.unreadCount > 0 && (
                                        <div className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-main-green" />
                                    )}

                                    <UserAvatar
                                        userId={conversation.otherUserId}
                                        displayName={conversation.displayName}
                                        avatarUrl={conversation.avatarUrl}
                                        size={52}
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <div className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-bold text-gray-950" : "font-semibold text-gray-900"}`}>
                                                {conversation.displayName}
                                            </div>

                                            {conversation.isPinned && (
                                                <Pin className="size-3.5 shrink-0 text-main-gray" />
                                            )}

                                            <div className="ml-auto shrink-0 text-[11px] text-main-gray">
                                                {formatConversationTime(
                                                    previewTime
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-1 flex min-w-0 items-center gap-2">
                                            <div className={`min-w-0 flex-1 truncate text-sm ${conversation.unreadCount > 0 ? "font-medium text-gray-700" : "text-main-gray"}`}>
                                                {isMessageMatch && (
                                                    <span className="mr-1 text-main-green">
                                                        Найдено:
                                                    </span>
                                                )}

                                                {isOwnPreview && (
                                                    <span className="text-gray-500">
                                                        Вы:{" "}
                                                    </span>
                                                )}

                                                {preview}
                                            </div>

                                            {conversation.unreadCount > 0 && (
                                                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-main-green px-1.5 text-[11px] font-bold text-white">
                                                    {conversation.unreadCount > 99
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