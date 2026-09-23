"use client"

import type { CSSProperties } from "react"
import { useEffect, useRef, useState } from "react"

function useDirectVisualViewport() {
    const [style, setStyle] = useState<CSSProperties | undefined>(undefined)
    const lastRef = useRef({
        top: -1,
        height: -1
    })

    useEffect(() => {
        const viewport = window.visualViewport
        const desktopQuery = window.matchMedia("(min-width: 1024px)")

        if (!viewport) {
            return
        }

        let frameId = 0

        const update = () => {
            window.cancelAnimationFrame(frameId)

            frameId = window.requestAnimationFrame(() => {
                if (desktopQuery.matches) {
                    lastRef.current = {
                        top: -1,
                        height: -1
                    }
                    setStyle(undefined)
                    return
                }

                const top = Math.max(0, Math.round(viewport.offsetTop))
                const height = Math.max(1, Math.round(viewport.height))

                if (
                    lastRef.current.top === top &&
                    lastRef.current.height === height
                ) {
                    return
                }

                lastRef.current = {
                    top,
                    height
                }

                setStyle({
                    top: `${top}px`,
                    bottom: "auto",
                    height: `${height}px`
                })
            })
        }

        update()

        viewport.addEventListener("resize", update)
        viewport.addEventListener("scroll", update)
        desktopQuery.addEventListener("change", update)
        window.addEventListener("orientationchange", update)

        return () => {
            window.cancelAnimationFrame(frameId)
            viewport.removeEventListener("resize", update)
            viewport.removeEventListener("scroll", update)
            desktopQuery.removeEventListener("change", update)
            window.removeEventListener("orientationchange", update)
        }
    }, [])

    return style
}

export default useDirectVisualViewport
