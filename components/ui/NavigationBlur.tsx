"use client"

import { LoaderCircle } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

function NavigationBlur() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [isNavigating, setIsNavigating] = useState(false)

    useEffect(() => {
        const handleNavigationStart = () => {
            setIsNavigating(true)
        }

        const handleNavigationEnd = () => {
            setIsNavigating(false)
        }

        window.addEventListener("vseti:navigation-start", handleNavigationStart)
        window.addEventListener("vseti:navigation-end", handleNavigationEnd)

        return () => {
            window.removeEventListener("vseti:navigation-start", handleNavigationStart)
            window.removeEventListener("vseti:navigation-end", handleNavigationEnd)
        }
    }, [])

    useEffect(() => {
        setIsNavigating(false)
    }, [pathname, searchParams])

    useEffect(() => {
        const handleClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

            const target = event.target

            if (!(target instanceof Element)) return

            const anchor = target.closest("a")

            if (!anchor) return
            if (anchor.target === "_blank") return
            if (anchor.hasAttribute("download")) return

            const href = anchor.href

            if (!href) return

            const url = new URL(href)

            if (url.origin !== window.location.origin) return

            const currentUrl = `${window.location.pathname}${window.location.search}`
            const nextUrl = `${url.pathname}${url.search}`

            if (currentUrl === nextUrl) return

            setIsNavigating(true)
        }

        document.addEventListener("click", handleClick, true)

        return () => {
            document.removeEventListener("click", handleClick, true)
        }
    }, [])

    if (!isNavigating) return null

    return (
        <div className="fixed inset-0 z-99999 flex cursor-wait items-center justify-center bg-black/5 backdrop-blur-[3px]">
            <LoaderCircle className="size-9 animate-spin text-main-green drop-shadow-sm" />
        </div>
    )
}

export default NavigationBlur