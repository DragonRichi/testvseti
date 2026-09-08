"use client"

import { syncUserLocation } from "@/actions/syncUserLocation"
import { usePathname, useRouter } from "next/navigation"
import { useCallback, useEffect, useRef } from "react"

type Props = {
    userId: string
}

const SYNC_INTERVAL_MS = 4 * 60 * 60 * 1000
const MAX_JITTER_MS = 15 * 60 * 1000
const RETRY_DELAY_MS = 5 * 60 * 1000

function createNextSyncAt() {
    const jitter =
        Math.floor(
            Math.random() *
            MAX_JITTER_MS
        )

    return (
        Date.now() +
        SYNC_INTERVAL_MS +
        jitter
    )
}

function GeoLocationSync({ userId }: Props) {
    const pathname = usePathname()
    const router = useRouter()

    const syncLockRef = useRef(false)
    const timerRef = useRef<number | null>(
        null
    )

    const nextSyncKey =
        `vseti-feed-geo-next-sync:${userId}`

    const clearTimer = useCallback(() => {
        if (timerRef.current === null) {
            return
        }

        window.clearTimeout(
            timerRef.current
        )

        timerRef.current = null
    }, [])

    const syncIfDue =
        useCallback(async () => {
            if (syncLockRef.current) {
                return
            }

            const nextSyncAt = Number(
                localStorage.getItem(
                    nextSyncKey
                ) ?? "0"
            )

            if (
                Number.isFinite(nextSyncAt) &&
                nextSyncAt > Date.now()
            ) {
                return
            }

            syncLockRef.current = true

            try {
                const result =
                    await syncUserLocation()

                if (
                    result.success === false
                ) {
                    localStorage.setItem(
                        nextSyncKey,
                        String(
                            Date.now() +
                            RETRY_DELAY_MS
                        )
                    )

                    return
                }

                localStorage.setItem(
                    nextSyncKey,
                    String(
                        createNextSyncAt()
                    )
                )

                if (
                    process.env.NODE_ENV ===
                    "development"
                ) {
                    console.log(
                        "FEED GEO SYNC:",
                        result
                    )
                }

                if (
                    result.changed &&
                    pathname === "/feed"
                ) {
                    router.refresh()
                }
            } catch (error) {
                console.error(
                    "FEED GEO SYNC ERROR:",
                    error
                )

                localStorage.setItem(
                    nextSyncKey,
                    String(
                        Date.now() +
                        RETRY_DELAY_MS
                    )
                )
            } finally {
                syncLockRef.current =
                    false
            }
        }, [
            nextSyncKey,
            pathname,
            router
        ])

    useEffect(() => {
        let disposed = false

        const scheduleNextCheck = () => {
            if (disposed) return

            clearTimer()

            const savedNextSyncAt =
                Number(
                    localStorage.getItem(
                        nextSyncKey
                    ) ?? "0"
                )

            const nextSyncAt =
                Number.isFinite(
                    savedNextSyncAt
                ) &&
                savedNextSyncAt >
                    Date.now()
                    ? savedNextSyncAt
                    : Date.now()

            const delay = Math.max(
                1000,
                nextSyncAt -
                    Date.now()
            )

            timerRef.current =
                window.setTimeout(
                    async () => {
                        await syncIfDue()

                        scheduleNextCheck()
                    },
                    delay
                )
        }

        const checkNow = async () => {
            await syncIfDue()
            scheduleNextCheck()
        }

        const handleVisibilityChange =
            () => {
                if (
                    document.visibilityState ===
                    "visible"
                ) {
                    void checkNow()
                }
            }

        const handleFocus = () => {
            void checkNow()
        }

        const handleOnline = () => {
            void checkNow()
        }

        void checkNow()

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        )

        window.addEventListener(
            "focus",
            handleFocus
        )

        window.addEventListener(
            "online",
            handleOnline
        )

        return () => {
            disposed = true

            clearTimer()

            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            )

            window.removeEventListener(
                "focus",
                handleFocus
            )

            window.removeEventListener(
                "online",
                handleOnline
            )
        }
    }, [
        clearTimer,
        nextSyncKey,
        syncIfDue
    ])

    return null
}

export default GeoLocationSync