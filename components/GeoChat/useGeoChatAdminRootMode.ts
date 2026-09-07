"use client"

import { getGeoChatAdminModeStatus } from "@/actions/geoChatAdminMode"
import { useEffect, useState } from "react"

function useGeoChatAdminRoomMode(initialAdminMode: boolean) {
    const [isAdminMode, setIsAdminMode] = useState(initialAdminMode)
    const [isChecking, setIsChecking] = useState(!initialAdminMode)

    useEffect(() => {
        if (initialAdminMode) {
            setIsAdminMode(true)
            setIsChecking(false)
            return
        }

        let active = true

        const checkAdminMode = async () => {
            try {
                const result = await getGeoChatAdminModeStatus()

                if (!active) return

                setIsAdminMode(result)
            } catch (error) {
                console.error("GEO CHAT ADMIN ROOM MODE ERROR:", error)

                if (active) {
                    setIsAdminMode(false)
                }
            } finally {
                if (active) {
                    setIsChecking(false)
                }
            }
        }

        void checkAdminMode()

        return () => {
            active = false
        }
    }, [initialAdminMode])

    return {
        isAdminMode,
        isChecking
    }
}

export default useGeoChatAdminRoomMode