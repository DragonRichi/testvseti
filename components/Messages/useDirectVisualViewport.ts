"use client"

import type { CSSProperties } from "react"
import {
    useEffect,
    useState
} from "react"

function useDirectVisualViewport() {
    const [
        style,
        setStyle
    ] =
        useState<
            CSSProperties | undefined
        >(undefined)

    useEffect(() => {
        const update = () => {
            if (
                window.innerWidth >=
                1024
            ) {
                setStyle(undefined)
                return
            }

            const viewport =
                window.visualViewport

            if (!viewport) {
                setStyle(undefined)
                return
            }

            const top =
                Math.max(
                    64,
                    viewport.offsetTop +
                        64
                )

            const height =
                Math.max(
                    220,
                    viewport.height -
                        64
                )

            setStyle({
                top,
                height,
                bottom: "auto"
            })
        }

        update()

        window.addEventListener(
            "resize",
            update
        )

        window.addEventListener(
            "orientationchange",
            update
        )

        window.visualViewport?.addEventListener(
            "resize",
            update
        )

        window.visualViewport?.addEventListener(
            "scroll",
            update
        )

        return () => {
            window.removeEventListener(
                "resize",
                update
            )

            window.removeEventListener(
                "orientationchange",
                update
            )

            window.visualViewport?.removeEventListener(
                "resize",
                update
            )

            window.visualViewport?.removeEventListener(
                "scroll",
                update
            )
        }
    }, [])

    return style
}

export default useDirectVisualViewport