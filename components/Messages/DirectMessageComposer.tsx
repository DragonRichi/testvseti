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
}

function DirectMessageComposer({
    content,
    isPending,
    textareaRef,
    onContentChange,
    onSubmit
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
        <div className="shrink-0 border-t border-gray-100 bg-white px-2 py-2 sm:p-4">
            <div className="flex items-end gap-2 rounded-2xl border border-gray-200 bg-white p-1.5 sm:p-2">
                <textarea
                    ref={textareaRef}
                    value={content}
                    disabled={isPending}
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
                    className="min-h-[38] max-h-[100] min-w-0 flex-1 resize-none overflow-y-hidden border-0 bg-transparent px-2 py-2 text-[16px] leading-5.5 text-gray-900 outline-none placeholder:text-main-gray disabled:opacity-50 lg:text-sm"
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