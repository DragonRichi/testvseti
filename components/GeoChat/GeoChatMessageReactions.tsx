"use client"

import type { GeoChatMessageReaction } from "@/types/geoChatReactions"

type Props = {
    messageId: string
    reactions: GeoChatMessageReaction[]
    canReact: boolean
    pendingKeys: Set<string>
    onToggle: (messageId: string, emoji: string) => void
}

function GeoChatMessageReactions({
    messageId,
    reactions,
    canReact,
    pendingKeys,
    onToggle
}: Props) {
    if (reactions.length === 0) return null

    return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {reactions.map((reaction) => {
                const pendingKey = `${messageId}:${reaction.emoji}`
                const pending = pendingKeys.has(pendingKey)

                return (
                    <button
                        key={reaction.emoji}
                        type="button"
                        disabled={!canReact || pending}
                        onClick={() => onToggle(messageId, reaction.emoji)}
                        className={`flex h-7 cursor-pointer items-center gap-1 rounded-full border px-2 text-xs transition-colors disabled:cursor-wait disabled:opacity-60 ${reaction.reactedByMe ? "border-green-200 bg-green-50 text-main-green" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                        <span className="text-sm leading-none">{reaction.emoji}</span>
                        <span>{reaction.count}</span>
                    </button>
                )
            })}
        </div>
    )
}

export default GeoChatMessageReactions