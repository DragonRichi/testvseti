"use client"

import { LoaderCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import AuthModal from "../Auth/AuthModal"
import Logo from "../ui/Logo"

type Props = {
    isAuthenticated: boolean
}

function MainPage({ isAuthenticated }: Props) {
    const [isEntering, setIsEntering] = useState(false)
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const router = useRouter()

    const handleEnterNetwork = () => {
        if (isEntering) return

        if (isAuthenticated) {
            window.dispatchEvent(new Event("vseti:navigation-start"))
            router.push("/feed")
            return
        }

        setIsAuthOpen(true)
    }

    return (
        <div className="relative min-h-dvh w-full overflow-hidden bg-zoom">
            <div className="relative z-10 min-h-dvh px-4 pt-4">
                <header className="mx-auto flex w-full max-w-[600] items-center justify-between gap-2 rounded-full border border-black/5 bg-white/95 px-2 py-2 shadow-sm backdrop-blur-md">
                    <Logo />

                    <nav className="hidden items-center gap-4 text-sm text-main-gray sm:flex">
                        <Link href="https://www.threads.com/@vsetiapp" className="transition-colors hover:text-black">
                            Новости
                        </Link>

                        <Link href="https://www.threads.com/@vsetiapp" className="transition-colors hover:text-black">
                            О проекте
                        </Link>
                    </nav>

                    <Link href="https://chat.vseti.by/" className="shrink-0 rounded-full bg-main-green px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-hover-green sm:px-4 sm:text-sm">
                        Войти в чат
                    </Link>
                </header>

                <button
                    onClick={handleEnterNetwork}
                    disabled={isEntering}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer whitespace-nowrap rounded-full bg-main-green px-6 py-3 font-medium text-white transition-all hover:bg-hover-green active:scale-[0.98] disabled:cursor-wait">
                    {isAuthenticated ? "Перейти в ленту" : "Войти в сеть"}
                </button>

                <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-sm text-main-gray">
                    ВСети&nbsp;©&nbsp;2008–2026
                </footer>
            </div>

            <AuthModal onClose={() => setIsAuthOpen(false)} open={isAuthOpen} />

            {isEntering && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-white/35 backdrop-blur-[3px]">
                    <LoaderCircle className="size-9 animate-spin text-main-green drop-shadow-sm" />
                </div>
            )}
        </div>
    )
}

export default MainPage