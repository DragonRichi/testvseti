"use client"

import { getNearbyGeoChats } from "@/actions/getNearbyGeoChats"
import type { NearbyGeoChat } from "@/types/geoChat"
import { MapPin, MessageCircle, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type Props = {
    accuracy: number | null
}

function formatDistance(distanceM: number | null) {
    if (distanceM === null) {
        return "Тестовый доступ"
    }

    if (distanceM < 1000) {
        return `${Math.max(1, Math.round(distanceM))} м`
    }

    return `${(distanceM / 1000).toFixed(1)} км`
}

function formatRadius(radiusM: number) {
    return `${Math.round(radiusM / 1000)} км`
}

function NearbyGeoChats({ accuracy }: Props) {
    const [chats, setChats] = useState<NearbyGeoChat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

    const loadChats = useCallback(async () => {
        setIsLoading(true)
        setError("")

        try {
            const result = await getNearbyGeoChats()

            if (result.success === false) {
                setError(result.error)
                return
            }

            setChats(result.chats)
        } catch (error) {
            console.error("NEARBY GEO CHATS ERROR:", error)
            setError("Не удалось загрузить геочаты")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        void loadChats()
    }, [loadChats])

    return (
        <div className="space-y-4">
            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Геочаты рядом</h2>
                        <div className="mt-1 text-sm text-main-gray">Доступны в вашем текущем местоположении</div>

                        {accuracy !== null && (
                            <div className="mt-2 text-xs text-main-gray">
                                {accuracy > 1000 ? `Примерное местоположение · ±${Math.max(1, Math.round(accuracy / 1000))} км` : `Точность местоположения ±${Math.round(accuracy)} м`}
                            </div>
                        )}
                    </div>

                    <Link href="/geochats/new" className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">Создать</span>
                    </Link>
                </div>
            </div>

            {isLoading && (
                <div className="flex min-h-[260] items-center justify-center rounded-2xl border border-green-100 bg-white">
                    <div className="flex flex-col items-center text-center">
                        <RefreshCw className="size-6 animate-spin text-main-green" />
                        <div className="mt-3 text-sm text-main-gray">Ищем геочаты рядом...</div>
                    </div>
                </div>
            )}

            {!isLoading && error && (
                <div className="flex min-h-[260] items-center justify-center rounded-2xl border border-red-100 bg-white px-5">
                    <div className="text-center">
                        <div className="text-sm text-red-600">{error}</div>

                        <button type="button" onClick={() => void loadChats()} className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-green-200 px-4 text-sm font-medium text-main-green hover:bg-green-50">
                            <RefreshCw className="size-4" />
                            <span>Повторить</span>
                        </button>
                    </div>
                </div>
            )}

            {!isLoading && !error && chats.length === 0 && (
                <div className="flex min-h-[300] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                    <div className="flex max-w-[420] flex-col items-center text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                            <MapPin className="size-6" />
                        </div>

                        <div className="mt-4 text-base font-semibold text-gray-900">Поблизости пока нет геочатов</div>

                        <div className="mt-2 text-sm leading-6 text-main-gray">Создайте первый геочат для людей, которые находятся рядом с вами.</div>

                        <Link href="/geochats/new" className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-main-green px-5 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                            <Plus className="size-4" />
                            <span>Создать геочат</span>
                        </Link>
                    </div>
                </div>
            )}

            {!isLoading && !error && chats.length > 0 && (
                <div className="space-y-3">
                    {chats.map((chat) => (
                        <Link key={chat.id} href={`/geochats/${chat.id}`} className="block rounded-2xl border border-green-100 bg-white p-5 transition-colors hover:border-green-200 hover:bg-green-50/30 sm:p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-green-50 text-main-green">
                                    <MessageCircle className="size-5" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <h3 className="truncate text-base font-semibold text-gray-900">{chat.name}</h3>

                                        <div className="flex items-center gap-1 text-xs font-medium text-main-green">
                                            <MapPin className="size-3.5" />
                                            <span>{formatDistance(chat.distanceM)}</span>
                                        </div>
                                    </div>

                                    {chat.description && (
                                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-main-gray">{chat.description}</p>
                                    )}

                                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-main-gray">
                                        <span>Радиус {formatRadius(chat.radiusM)}</span>
                                        <span>Создал @{chat.creatorUsername}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}

export default NearbyGeoChats