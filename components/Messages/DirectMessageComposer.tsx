"use client"

import { Send } from "lucide-react"
import type {
    KeyboardEvent,
    RefObject
} from "react"

type Props = {
    content: string
    isPending: boolean
    textareaRef: RefObject<HTMLTextAreaElement | null>
    onContentChange: (
        value: string
    ) => void
    onSubmit: () => void
    onFocus: () => void
    onBlur: () => void
}

function DirectMessageComposer({
    content,
    isPending,
    textareaRef,
    onContentChange,
    onSubmit,
    onFocus,
    onBlur
}: Props) {
    const canSubmit =
        Boolean(
            content.trim()
        ) &&
        !isPending

    const handleKeyDown = (
        event: KeyboardEvent<HTMLTextAreaElement>
    ) => {
        if (
            event.key !== "Enter" ||
            event.shiftKey
        ) {
            return
        }

        event.preventDefault()

        if (canSubmit) {
            onSubmit()
        }
    }

    return (
        <div className="shrink-0 border-t border-[#ecefec] bg-white px-2 py-2 sm:p-4">
            <div className="flex items-end gap-2 rounded-[16px] bg-[#f2f4f1] p-1.5 sm:p-2">
                <textarea
                    ref={textareaRef}
                    value={content}
                    disabled={isPending}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    onKeyDown={handleKeyDown}
                    onChange={(event) => {
                        onContentChange(
                            event.target.value
                        )

                        event.currentTarget.style.height =
                            "38px"

                        const nextHeight =
                            Math.min(
                                event
                                    .currentTarget
                                    .scrollHeight,
                                100
                            )

                        event.currentTarget.style.height =
                            `${nextHeight}px`

                        event.currentTarget.style.overflowY =
                            event
                                .currentTarget
                                .scrollHeight >
                                100
                                ? "auto"
                                : "hidden"
                    }}
                    placeholder="Написать сообщение..."
                    maxLength={4000}
                    rows={1}
                    className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-2 py-2 text-[16px]! leading-5.5 text-[#202520] outline-none placeholder:text-[13px]! placeholder:text-[#9ca19d] disabled:opacity-50 lg:text-sm"
                />

                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={
                        !canSubmit
                    }
                    aria-label="Отправить"
                    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-main-green text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-40 sm:size-10"
                >
                    <Send className="size-4" />
                </button>
            </div>
        </div>
    )
}

export default DirectMessageComposer