"use client"

import { searchDirectMessages, type DirectMessageSearchMatch } from "@/actions/searchDirectMessages"
import type { DirectConversationSummary } from "@/types/directMessages"
import { useEffect, useMemo, useState } from "react"

export type DisplayConversation = {
    conversation: DirectConversationSummary
    preview: string
    previewUserId: string | null
    previewTime: string | null
    isMessageMatch: boolean
}

function useDirectConversationSearch(conversations: DirectConversationSummary[]) {
    const [query, setQuery] = useState("")
    const [messageMatches, setMessageMatches] = useState<DirectMessageSearchMatch[]>([])
    const [isSearchingMessages, setIsSearchingMessages] = useState(false)

    useEffect(() => {
        const normalizedQuery = query.trim()

        if (normalizedQuery.length < 2) {
            setMessageMatches([])
            setIsSearchingMessages(false)
            return
        }

        let cancelled = false
        setIsSearchingMessages(true)

        const timer = window.setTimeout(async () => {
            try {
                const matches = await searchDirectMessages(normalizedQuery)
                if (!cancelled) setMessageMatches(matches)
            } catch (error) {
                if (!cancelled) {
                    console.error("DIRECT MESSAGE SEARCH ERROR:", error)
                    setMessageMatches([])
                }
            } finally {
                if (!cancelled) setIsSearchingMessages(false)
            }
        }, 300)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [query])

    const filtered = useMemo<DisplayConversation[]>(() => {
        const normalized = query.trim().toLocaleLowerCase("ru-RU")

        if (!normalized) {
            return conversations.map((conversation) => ({
                conversation,
                preview: conversation.lastMessage || "Сообщение",
                previewUserId: conversation.lastMessageUserId,
                previewTime: conversation.lastMessageTime,
                isMessageMatch: false
            }))
        }

        const matchesByConversation = new Map<string, DirectMessageSearchMatch>()
        for (const match of messageMatches) {
            if (!matchesByConversation.has(match.conversationId)) matchesByConversation.set(match.conversationId, match)
        }

        const result: DisplayConversation[] = []

        for (const conversation of conversations) {
            const nameMatches = conversation.displayName.toLocaleLowerCase("ru-RU").includes(normalized) || conversation.username.toLocaleLowerCase("ru-RU").includes(normalized)
            const messageMatch = matchesByConversation.get(conversation.id)

            if (!nameMatches && !messageMatch) continue

            result.push({
                conversation,
                preview: messageMatch?.content ?? conversation.lastMessage ?? "Сообщение",
                previewUserId: messageMatch?.messageUserId ?? conversation.lastMessageUserId,
                previewTime: messageMatch?.createdAt ?? conversation.lastMessageTime,
                isMessageMatch: Boolean(messageMatch)
            })
        }

        return result
    }, [conversations, messageMatches, query])

    return { query, setQuery, filtered, isSearchingMessages }
}

export default useDirectConversationSearch
