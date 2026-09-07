"use client"

import { disableGeoChatAdminMode, enableGeoChatAdminMode } from "@/actions/geoChatAdminMode"
import { LoaderCircle, Shield, ShieldCheck, X } from "lucide-react"
import { useState } from "react"

type Props = {
    adminMode: boolean
    onChanged: () => Promise<void>
}

function GeoChatAdminAccess({ adminMode, onChanged }: Props) {
    const [isOpen, setIsOpen] = useState(false)
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isPending, setIsPending] = useState(false)

    const handleEnable = async () => {
        if (isPending) return

        setError("")
        setIsPending(true)

        try {
            const result = await enableGeoChatAdminMode(password)

            if (result.success === false) {
                setError(result.error)
                return
            }

            setPassword("")
            setIsOpen(false)

            await onChanged()
        } finally {
            setIsPending(false)
        }
    }

    const handleDisable = async () => {
        if (isPending) return

        setIsPending(true)

        try {
            await disableGeoChatAdminMode()
            await onChanged()
        } finally {
            setIsPending(false)
        }
    }

    if (adminMode) {
        return (
            <button type="button" onClick={() => void handleDisable()} disabled={isPending} title="Отключить просмотр всех геочатов" className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 text-xs font-semibold text-main-green transition-colors hover:bg-green-100 disabled:cursor-wait disabled:opacity-60">
                {isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                <span className="hidden sm:inline">Все геочаты</span>
            </button>
        )
    }

    return (
        <>
            <button type="button" onClick={() => setIsOpen(true)} title="Режим модератора" aria-label="Режим модератора" className="flex size-10 cursor-pointer items-center justify-center rounded-xl border border-gray-200 bg-white text-main-gray transition-colors hover:border-green-200 hover:bg-green-50 hover:text-main-green">
                <Shield className="size-4" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/20 px-4 backdrop-blur-[3px]" onMouseDown={() => setIsOpen(false)}>
                    <div className="w-full max-w-[380] rounded-2xl border border-green-100 bg-white p-5 shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <div className="text-base font-bold text-gray-900">Просмотр всех геочатов</div>
                                <div className="mt-1 text-sm leading-5 text-main-gray">Введите пароль доступа.</div>
                            </div>

                            <button type="button" onClick={() => setIsOpen(false)} className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-gray-100">
                                <X className="size-4" />
                            </button>
                        </div>

                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleEnable()} autoFocus placeholder="Пароль" className="mt-5 h-11 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition-colors focus:border-main-green" />

                        {error && (
                            <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">{error}</div>
                        )}

                        <button type="button" onClick={() => void handleEnable()} disabled={isPending || !password} className="mt-4 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-4 text-sm font-semibold text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-60">
                            {isPending && <LoaderCircle className="size-4 animate-spin" />}
                            <span>{isPending ? "Проверяем..." : "Открыть все геочаты"}</span>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}

export default GeoChatAdminAccess