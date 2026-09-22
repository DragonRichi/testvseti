"use client"

import type { DirectMessage } from "@/types/directMessages"
import UserAvatar from "../ui/UserAvatar"

type Props = {
    message: DirectMessage
    currentProfileId: string
}

function formatMessageDateTime(value: string) {
    const date = new Date(value)
    const now = new Date()

    const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    )

    const startOfMessageDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
    )

    const diffDays = Math.round(
        (
            startOfToday.getTime() -
            startOfMessageDay.getTime()
        ) /
        86400000
    )

    const time = new Intl.DateTimeFormat(
        "ru-RU",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date)

    if (diffDays === 0) {
        return time
    }

    if (diffDays === 1) {
        return `вчера, ${time}`
    }

    const fullDate = new Intl.DateTimeFormat(
        "ru-RU",
        {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        }
    ).format(date)

    return `${fullDate}, ${time}`
}
function DirectMessageItem({
    message,
    currentProfileId
}: Props) {
    const isOwn =
        message.userId ===
        currentProfileId

    return (
        <div className={`flex items-end gap-2 ${isOwn ? "justify-end" : "justify-start"}`}>
            {!isOwn && (
                <UserAvatar
                    userId={message.userId}
                    displayName={message.authorDisplayName}
                    avatarUrl={message.authorAvatarUrl}
                    size={32}
                    className="mb-1"
                />
            )}

            <div className={`max-w-[82%] rounded-[18px] px-3 py-2 sm:max-w-[70%] sm:px-4 ${isOwn ? "rounded-br-md bg-main-green text-white" : "rounded-bl-md bg-[#f1f3f1] text-gray-900"}`}>
                {message.replyTo && (
                    <div className={`mb-2 rounded-xl border-l-2 px-2.5 py-1.5 text-xs ${isOwn ? "border-white/70 bg-white/10" : "border-main-green bg-white/70"}`}>
                        <div className={`font-semibold ${isOwn ? "text-white" : "text-main-green"}`}>
                            {message.replyTo.authorDisplayName ?? "Сообщение"}
                        </div>

                        <div className={`mt-0.5 truncate ${isOwn ? "text-white/80" : "text-main-gray"}`}>
                            {message.replyTo.content ?? "Сообщение"}
                        </div>
                    </div>
                )}

                <div className="flex items-end gap-2 ">
                    {message.content && (
                        <div className="min-w-0 whitespace-pre-wrap wrap-break-words text-sm leading-5.5">
                            {message.content}
                        </div>
                    )}

                    <div className={`ml-auto shrink-0 whitespace-nowrap pb-0.5 text-[10px] leading-none ${isOwn ? "text-white/70" : "text-main-gray"}`}>
                        {message.isEdited && (
                            <span>
                                изменено ·{" "}
                            </span>
                        )}

                        <span>
                            {formatMessageDateTime(
                                message.createdAt
                            )}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DirectMessageItem