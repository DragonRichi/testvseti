"use client"

import { toggleFollowProfile } from "@/actions/toggleFollowProfile"
import { Check, UserPlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

type Props = {
    profileId: string
    username: string
    initialFollowing: boolean
    variant?: "default" | "compact"
}

function FollowButton({
    profileId,
    username,
    initialFollowing,
    variant = "default"
}: Props) {
    const [isFollowing, setIsFollowing] =
        useState<boolean>(initialFollowing)

    const [isPending, setIsPending] =
        useState<boolean>(false)

    const lockRef =
        useRef(false)

    const router =
        useRouter()

    const handleClick =
        async () => {
            if (lockRef.current) {
                return
            }

            const previousValue =
                isFollowing

            const nextValue =
                !previousValue

            lockRef.current =
                true

            setIsPending(true)
            setIsFollowing(
                nextValue
            )

            try {
                const result =
                    await toggleFollowProfile(
                        profileId,
                        username,
                        nextValue
                    )

                if (
                    result.success ===
                    false
                ) {
                    setIsFollowing(
                        previousValue
                    )

                    console.error(
                        "FOLLOW ACTION ERROR:",
                        result.error
                    )

                    return
                }

                setIsFollowing(
                    result.isFollowing
                )

                router.refresh()
            } catch (error) {
                setIsFollowing(
                    previousValue
                )

                console.error(
                    "FOLLOW ACTION ERROR:",
                    error
                )
            } finally {
                lockRef.current =
                    false

                setIsPending(false)
            }
        }

    if (
        variant === "compact"
    ) {
        return (
            <button
                type="button"
                onClick={
                    handleClick
                }
                disabled={
                    isPending
                }
                className="flex h-10 w-full min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-main-green px-2 text-[12px] font-semibold text-white transition-colors hover:bg-hover-green sm:h-11 sm:gap-2 sm:px-4 sm:text-[14px]"            >
                {isFollowing ? (
                    <Check className="size-3.5" />
                ) : (
                    <UserPlus className="hidden size-4 shrink-0 sm:block" />
                )}

                <span className="truncate whitespace-nowrap">
                    {isFollowing ? "Вы читаете" : "Подписаться"}
                </span>
            </button>
        )
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isPending}
            className={`flex h-[42] w-full min-w-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-4 text-[14px] font-semibold leading-none transition-colors disabled:pointer-events-none disabled:opacity-60 ${isFollowing ? "border-[#dedede] bg-white text-[#555555] hover:border-red-200 hover:bg-red-50 hover:text-red-500" : "border-main-green bg-main-green text-white hover:bg-hover-green"}`}
        >
            {isFollowing ? (
                <Check className="size-4" />
            ) : (
                <span className="text-[22px] font-light leading-none">
                    +
                </span>
            )}

            <span>
                {isFollowing
                    ? "Вы подписаны"
                    : "Подписаться"}
            </span>
        </button>
    )
}

export default FollowButton