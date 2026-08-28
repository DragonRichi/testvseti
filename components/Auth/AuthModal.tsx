"use client"

import { X } from "lucide-react"
import { useEffect } from "react"
import AuthForm from "./AuthForm"

type Props = {
    open: boolean
    onClose: () => void
}

function AuthModal({ onClose, open }: Props) {

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && open) {
                onClose()
            }
        }
        if (open) {
            document.body.style.overflow = "hidden"
        }

        window.addEventListener("keydown", handleKeyDown)

        return () => {
            document.body.style.overflow = ""
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [open, onClose])

    return (
        <div
            aria-hidden={!open}
            onMouseDown={onClose}
            className={`
                fixed inset-0 z-50
                flex items-center justify-center
                px-4

                transition-all
                duration-300
                ease-out

                ${open
                    ? "pointer-events-auto bg-black/25 opacity-100 backdrop-blur-[3px]"
                    : "pointer-events-none bg-black/0 opacity-0 backdrop-blur-none"
                }
            `}
        >
            <div
                role="dialog"
                aria-modal="true"
                onMouseDown={(e) => e.stopPropagation()}
                className={`
                    relative
                    max-h-[90dvh]
                    w-full max-w-[520]
                    overflow-y-auto
                    rounded-3xl
                    border border-black/5
                    bg-white
                    p-5
                    shadow-2xl

                    transition-all
                    duration-300
                    ease-out

                    sm:p-7

                    ${open
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-5 scale-95 opacity-0"
                    }
                `}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Закрыть"
                    className="
                        absolute right-4 top-4 z-10
                        flex size-9
                        cursor-pointer
                        items-center justify-center
                        rounded-full
                        bg-black/3
                        text-main-gray
                        transition-all
                        duration-200
                        hover:rotate-90
                        hover:bg-black/7
                        hover:text-black
                    "
                >
                    <X className="size-5" />
                </button>

                <AuthForm />
            </div>
        </div>
    )
}

export default AuthModal
