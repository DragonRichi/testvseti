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
            <button type="button" onClick={handleBack} aria-label="Назад" className="flex size-10 cursor-pointer items-center justify-center rounded-full text-[#616161] transition-colors hover:bg-[#ededed] hover:text-[#202020]">
                <ArrowLeft className="size-5" strokeWidth={1.6} />
            </button>
        </div>
    )
}

export default PageBackButton