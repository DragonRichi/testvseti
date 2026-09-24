"use client"

import UserAvatar from "@/components/ui/UserAvatar"
import { Pin } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatConversationTime } from "./directConversationListHelpers"
import type { DisplayConversation } from "./useDirectConversationSearch"

type Props = {
    item: DisplayConversation
    currentProfileId: string
}

function DirectConversationRow({ item, currentProfileId }: Props) {
    const router = useRouter()
    const { conversation, preview, previewUserId, previewTime, isMessageMatch } = item
    const href = `/messages/${conversation.id}`
    const isOwnPreview = previewUserId === currentProfileId

    const prefetch = () => router.prefetch(href)

    return (
        <Link href={href} onPointerEnter={prefetch} onTouchStart={prefetch} onFocus={prefetch} className={`relative flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors sm:px-5 ${conversation.unreadCount > 0 ? "bg-[#f1fbf2] hover:bg-[#ecf8ed]" : "hover:bg-[#f6f8f5]"}`}>
            {conversation.unreadCount > 0 && <span className="absolute inset-y-3 left-0 w-[3] rounded-r-full bg-main-green" />}

            <UserAvatar userId={conversation.otherUserId} displayName={conversation.displayName} avatarUrl={conversation.avatarUrl} size={48} />

            <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                    <div className={`truncate text-sm ${conversation.unreadCount > 0 ? "font-bold text-[#151915]" : "font-semibold text-[#242924]"}`}>{conversation.displayName}</div>
                    {conversation.isPinned && <Pin className="size-3.5 shrink-0 text-[#999f9a]" />}
                    <div className="ml-auto shrink-0 text-[10px] text-[#a0a5a1]">{formatConversationTime(previewTime)}</div>
                </div>

                <div className="mt-1 flex min-w-0 items-center gap-2">
                    <div className={`min-w-0 flex-1 truncate text-[13px] ${conversation.unreadCount > 0 ? "font-medium text-[#606761]" : "text-[#8d938e]"}`}>
                        {isMessageMatch && <span className="mr-1 text-main-green">Найдено:</span>}
                        {isOwnPreview && <span className="text-[#737a74]">Вы: </span>}
                        {preview}
                    </div>

                    {conversation.unreadCount > 0 && (
                        <span className="flex h-[19] min-w-[19] shrink-0 items-center justify-center rounded-full bg-main-green px-1.5 text-[10px] font-bold text-white">
                            {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </Link>
    )
}

export default DirectConversationRow
