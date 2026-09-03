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

function FollowButton({ profileId, username, initialFollowing, variant = "default" }: Props) {
    const [isFollowing, setIsFollowing] = useState<boolean>(initialFollowing)
    const [isPending, setIsPending] = useState<boolean>(false)
    const lockRef = useRef(false)
    const router = useRouter()

    const handleClick = async () => {
        if (lockRef.current) return

        const previousValue = isFollowing
        const nextValue = !previousValue

        lockRef.current = true
        setIsPending(true)
        setIsFollowing(nextValue)

        try {
            const result = await toggleFollowProfile(profileId, username, nextValue)

            if (result.success === false) {
                setIsFollowing(previousValue)
                console.error("FOLLOW ACTION ERROR:", result.error)
                return
            }

            setIsFollowing(result.isFollowing)
            router.refresh()
        } catch (error) {
            setIsFollowing(previousValue)
            console.error("FOLLOW ACTION ERROR:", error)
        } finally {
            lockRef.current = false
            setIsPending(false)
        }
    }

    if (variant === "compact") {
        return (
            <button type="button" onClick={handleClick} disabled={isPending} className={`flex h-9 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 ${isFollowing ? "border border-green-200 bg-white text-main-green hover:border-red-200 hover:bg-red-50 hover:text-red-500" : "bg-main-green text-white hover:bg-hover-green"}`}>
                {isFollowing ? (
                    <>
                        <Check className="size-3.5" />
                        <span>Вы подписаны</span>
                    </>
                ) : (
                    <>
                        <UserPlus className="size-3.5" />
                        <span>Подписаться</span>
                    </>
                )}
            </button>
        )
    }

    return (
        <button type="button" onClick={handleClick} disabled={isPending} className={`flex h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-5 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-60 sm:flex-none ${isFollowing ? "border border-green-200 bg-white text-main-green hover:border-red-200 hover:bg-red-50 hover:text-red-500" : "bg-main-green text-white hover:bg-hover-green"}`}>
            {isFollowing ? (
                <>
                    <Check className="size-4" />
                    <span>Вы подписаны</span>
                </>
            ) : (
                <>
                    <UserPlus className="size-4" />
                    <span>Подписаться</span>
                </>
            )}
        </button>
    )
}

export default FollowButton