"use client"

import { startDirectConversation } from "@/actions/startDirectConversation"
import {
    LoaderCircle,
    MessageCircle
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
    useRef,
    useState
} from "react"

type Props = {
    profileId: string
}

function StartDirectConversationButton({
    profileId
}: Props) {
    const router =
        useRouter()

    const lockRef =
        useRef(false)

    const [
        isPending,
        setIsPending
    ] =
        useState(false)

    const [
        error,
        setError
    ] =
        useState("")

    const handleClick =
        async () => {
            if (
                lockRef.current
            ) {
                return
            }

            lockRef.current =
                true

            setIsPending(
                true
            )

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

                setIsPending(
                    false
                )
            }
        }

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={() =>
                    void handleClick()
                }
                disabled={
                    isPending
                }
                aria-label="Написать сообщение"
                className="flex size-10 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-green-200 bg-white text-sm font-medium text-main-green transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:px-4"
            >
                {isPending ? (
                    <LoaderCircle className="size-4 animate-spin" />
                ) : (
                    <MessageCircle className="size-4" />
                )}

                <span className="hidden sm:inline">
                    Написать
                </span>
            </button>

            {error && (
                <div role="status" className="absolute right-0 top-[46] z-30 w-[260] rounded-xl border border-red-100 bg-white px-3 py-2 text-xs leading-5 text-red-600 shadow-lg">
                    {error}
                </div>
            )}
        </div>
    )
}

export default StartDirectConversationButton