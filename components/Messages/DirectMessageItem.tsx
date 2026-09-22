"use client"

import type { DirectMessage } from "@/types/directMessages"
import Image from "next/image"

type Props = {
    message: DirectMessage
    currentProfileId: string
}

function formatMessageTime(
    value: string
) {
    return new Intl.DateTimeFormat(
        "ru-RU",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(
        new Date(value)
    )
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
                <div className="relative mb-1 size-8 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={message.authorAvatarUrl ?? "/user-avatar.svg"} alt={message.authorDisplayName} fill sizes="32px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>
            )}

            <div className={`max-w-[82%] rounded-[18px] px-3 py-2.5 sm:max-w-[70%] sm:px-4 ${isOwn ? "rounded-br-md bg-main-green text-white" : "rounded-bl-md bg-[#f1f3f1] text-gray-900"}`}>
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

                {message.content && (
                    <div className="whitespace-pre-wrap wrap-break-words text-sm leading-5.5">
                        {message.content}
                    </div>
                )}

                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOwn ? "text-white/70" : "text-main-gray"}`}>
                    {message.isEdited && (
                        <span>
                            изменено ·
                        </span>
                    )}

                    <span>
                        {formatMessageTime(
                            message.createdAt
                        )}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default DirectMessageItem