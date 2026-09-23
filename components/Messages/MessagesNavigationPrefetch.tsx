"use client"

import { useRouter } from "next/navigation"
import type { FocusEvent, PointerEvent, ReactNode, TouchEvent } from "react"
import { useCallback, useRef } from "react"

type Props = {
    children: ReactNode
}

function MessagesNavigationPrefetch({ children }: Props) {
    const router = useRouter()
    const prefetchedRef = useRef(new Set<string>())

    const prefetchFromTarget = useCallback(
        (target: EventTarget | null) => {
            if (!(target instanceof Element)) {
                return
            }

            const anchor = target.closest<HTMLAnchorElement>("a[href]")
            const href = anchor?.getAttribute("href")

            if (!href || !href.startsWith("/messages/")) {
                return
            }

            if (prefetchedRef.current.has(href)) {
                return
            }

            prefetchedRef.current.add(href)
            router.prefetch(href)
        },
        [router]
    )

    return (
        <div
            className="contents"
            onPointerOverCapture={(event: PointerEvent<HTMLDivElement>) =>
                prefetchFromTarget(event.target)
            }
            onTouchStartCapture={(event: TouchEvent<HTMLDivElement>) =>
                prefetchFromTarget(event.target)
            }
            onFocusCapture={(event: FocusEvent<HTMLDivElement>) =>
                prefetchFromTarget(event.target)
            }
        >
            {children}
        </div>
    )
}

export default MessagesNavigationPrefetch
