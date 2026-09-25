"use client"

import { useEffect, useRef } from "react"
import { loadInitialPostComments } from "./postCommentsPreload"

type NetworkInformation = {
    saveData?: boolean
    effectiveType?: string
}

type NavigatorWithConnection =
    Navigator & {
        connection?: NetworkInformation
    }

function usePostCommentsPreload(
    postId: string,
    enabled: boolean
) {
    const postRef =
        useRef<HTMLTitleElement>(
            null
        )

    useEffect(() => {
        if (!enabled) return

        const element =
            postRef.current

        if (!element) return

        const connection =
            (
                navigator as NavigatorWithConnection
            ).connection

        if (
            connection?.saveData ||
            connection?.effectiveType ===
                "slow-2g" ||
            connection?.effectiveType ===
                "2g"
        ) {
            return
        }

        if (
            !(
                "IntersectionObserver" in
                window
            )
        ) {
            return
        }

        const observer =
            new IntersectionObserver(
                (entries) => {
                    const entry =
                        entries[0]

                    if (
                        !entry?.isIntersecting
                    ) {
                        return
                    }

                    void loadInitialPostComments(
                        postId
                    )

                    observer.disconnect()
                },
                {
                    rootMargin:
                        "350px 0px"
                }
            )

        observer.observe(
            element
        )

        return () => {
            observer.disconnect()
        }
    }, [
        enabled,
        postId
    ])

    return postRef
}

export default usePostCommentsPreload