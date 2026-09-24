"use client"

import { startDirectConversation } from "@/actions/startDirectConversation"
import { LoaderCircle, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

type Props = {
    profileId: string
}

function StartDirectConversationButton({
    profileId
}: Props) {
    const router = useRouter()
    const lockRef = useRef(false)

    const [
        isPending,
        setIsPending
    ] = useState(false)

    const [error, setError] =
        useState("")

    const handleClick =
        async () => {
            if (lockRef.current) {
                return
            }

            lockRef.current = true
            setIsPending(true)
            setError("")

            try {
                const result =
                    await startDirectConversation(
                        profileId
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

                router.push(
                    `/messages/${result.conversationId}`
                )
            } catch (error) {
                console.error(
                    "START DIRECT CONVERSATION ERROR:",
                    error
                )

                setError(
                    "Не удалось открыть диалог"
                )
            } finally {
                lockRef.current =
                    false

                setIsPending(false)
            }
        }

    return (
        <div className="relative w-full min-w-0">
            <button
                type="button"
                onClick={() =>
                    void handleClick()
                }
                disabled={isPending}
                aria-label="Сообщение"
                className="flex h-[42] w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] bg-[#171717] px-4 text-[14px] font-semibold text-white transition-colors hover:bg-black disabled:pointer-events-none disabled:opacity-60"
            >
                {isPending ? (
                    <LoaderCircle className="size-4 shrink-0 animate-spin" />
                ) : (
                    <MessageCircle className="size-[18] shrink-0" strokeWidth={1.7} />
                )}

                <span>
                    Сообщение
                </span>
            </button>

            {error && (
                <div role="status" className="absolute right-0 top-[48] z-30 w-[260] rounded-xl border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-red-600 shadow-lg">
                    {error}
                </div>
            )}
        </div>
    )
}

export default StartDirectConversationButton