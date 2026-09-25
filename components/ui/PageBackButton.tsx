"use client"

import { ArrowLeft } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

function PageBackButton() {
    const pathname = usePathname()
    const router = useRouter()

    const hasOwnBackButton =
        /^\/messages\/[^/]+$/.test(pathname) ||
        /^\/geochats\/[^/]+$/.test(pathname)

    if (
        pathname === "/feed" ||
        hasOwnBackButton
    ) {
        return null
    }

    const handleBack = () => {
        if (
            typeof window !== "undefined" &&
            window.history.length > 1
        ) {
            router.back()
            return
        }

        router.push("/feed")
    }

    return (
        <div className="mb-3 flex items-center">
            <button type="button" onClick={handleBack} aria-label="Назад" className="flex size-10 cursor-pointer items-center justify-center rounded-full bg-white text-[#616161] shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors hover:bg-[#f5f5f5] hover:text-[#202020]">                <ArrowLeft className="size-5" strokeWidth={1.6} />
            </button>
        </div>
    )
}

export default PageBackButton