"use client"

import { getProfileNotificationSubscription } from "@/actions/getProfileNotificationSubscription"
import { toggleProfileNotificationSubscription } from "@/actions/toggleProfileNotificationSubscription"
import { AtSign, Bell, LoaderCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

type Props = {
    profileId: string
    username: string
}

const MENTION_STORAGE_KEY =
    "vseti:composer-mention"

function ProfileQuickActions({
    profileId,
    username
}: Props) {
    const router =
        useRouter()

    const toggleLockRef =
        useRef(false)

    const [
        notificationsEnabled,
        setNotificationsEnabled
    ] = useState(false)

    const [
        isPending,
        setIsPending
    ] = useState(false)

    useEffect(() => {
        let disposed = false

        const loadState =
            async () => {
                const result =
                    await getProfileNotificationSubscription(
                        profileId
                    )

                if (
                    disposed ||
                    result.success ===
                    false
                ) {
                    return
                }

                setNotificationsEnabled(
                    result.enabled
                )
            }

        void loadState()

        return () => {
            disposed = true
        }
    }, [profileId])

    useEffect(() => {
        router.prefetch("/feed")
    }, [router])

    const handleMention = () => {
        sessionStorage.setItem(
            MENTION_STORAGE_KEY,
            `@${username} `
        )

        router.push("/feed")
    }

    const handleNotifications =
        async () => {
            if (
                toggleLockRef.current
            ) {
                return
            }

            toggleLockRef.current =
                true

            setIsPending(true)

            try {
                const result =
                    await toggleProfileNotificationSubscription(
                        profileId
                    )

                if (
                    result.success ===
                    false
                ) {
                    console.error(
                        result.error
                    )

                    return
                }

                setNotificationsEnabled(
                    result.enabled
                )
            } catch (error) {
                console.error(
                    "PROFILE NOTIFICATION TOGGLE ERROR:",
                    error
                )
            } finally {
                toggleLockRef.current =
                    false

                setIsPending(false)
            }
        }

    return (
        <>
            <button
                type="button"
                onClick={handleMention}
                aria-label={`Упомянуть @${username}`}
                title={`Упомянуть @${username}`}
                className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e3e3e3] bg-white text-[#616161] transition-colors hover:bg-[#f5f5f5] hover:text-[#171717] sm:size-11"
            >
                <AtSign
                    className="size-[18] sm:size-5"
                    strokeWidth={1.6}
                />
            </button>

            <button
                type="button"
                onClick={() =>
                    void handleNotifications()
                }
                disabled={isPending}
                aria-pressed={
                    notificationsEnabled
                }
                aria-label={
                    notificationsEnabled
                        ? "Отключить уведомления о пользователе"
                        : "Включить уведомления о пользователе"
                }
                title={
                    notificationsEnabled
                        ? "Уведомления включены"
                        : "Включить уведомления"
                }
                className={`flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border transition-colors disabled:pointer-events-none disabled:opacity-60 sm:size-11 ${notificationsEnabled ? "border-main-green bg-[#eef9f1] text-main-green" : "border-[#e3e3e3] bg-white text-[#616161] hover:bg-[#f5f5f5] hover:text-[#171717]"}`}
            >
                {isPending ? (
                    <LoaderCircle className="size-[18] animate-spin" />
                ) : (
                    <Bell
                        className={`size-[18] sm:size-5 ${notificationsEnabled ? "fill-main-green/15" : ""}`}
                        strokeWidth={1.6}
                    />
                )}
            </button>
        </>
    )
}

export default ProfileQuickActions