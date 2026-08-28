"use client"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import AuthModal from "../Auth/AuthModal"
import { useRouter } from "next/navigation"

type Props = {
    isAuthenticated: boolean
}

function MainPage({ isAuthenticated }: Props) {
    const [isAuthOpen, setIsAuthOpen] = useState(false)
    const [isCheckingAuth, setIsCheckingAuth] = useState(false)
    const router = useRouter()

    const handleEnterNetwork = () => {
        if (isAuthenticated) {
            router.push("/feed")
            return
        }
        setIsAuthOpen(true)
    }

    return (
        <div className="relative min-h-dvh w-full overflow-hidden bg-zoom">

            <div className="relative z-10 min-h-dvh px-4 pt-4">

                <header
                    className="
                        mx-auto
                        flex w-full max-w-[600]
                        items-center justify-between gap-2
                        rounded-full
                        border border-black/5
                        bg-white/95
                        px-2 py-2
                        shadow-sm
                        backdrop-blur-md
                    "
                >
                    <Link
                        href="/"
                        className="flex shrink-0 items-center gap-2"
                    >
                        <Image
                            src="/logo.svg"
                            alt="logo"
                            width={40}
                            height={40}
                            unoptimized
                            priority
                            className="size-9 sm:size-10"
                        />

                        <span className="text-xl font-bold sm:text-2xl">
                            ВСети
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-4 text-sm text-main-gray sm:flex">
                        <Link
                            href="https://www.threads.com/@vsetiapp"
                            className="transition-colors hover:text-black"
                        >
                            Новости
                        </Link>

                        <Link
                            href="https://www.threads.com/@vsetiapp"
                            className="transition-colors hover:text-black"
                        >
                            О проекте
                        </Link>
                    </nav>

                    <Link
                        href="https://chat.vseti.by/"
                        className="
                            shrink-0 rounded-full
                            bg-main-green
                            px-3 py-2
                            text-xs font-medium text-white
                            transition-colors
                            hover:bg-hover-green
                            sm:px-4 sm:text-sm
                        "
                    >
                        Войти в чат
                    </Link>
                </header>


                <button
                    onClick={handleEnterNetwork}
                    className="cursor-pointer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-main-green px-6 py-3 font-medium text-white transition-colors hover:bg-hover-green"
                >
                    {isAuthenticated ? "Перейти в ленту" : "Войти в сеть"}
                </button>


                <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-center text-sm text-main-gray">
                    ВСети&nbsp;©&nbsp;2008–2026
                </footer>

            </div>

            <AuthModal onClose={() => setIsAuthOpen(false)} open={isAuthOpen} />

        </div>
    )
}

export default MainPage