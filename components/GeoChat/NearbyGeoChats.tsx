"use client"

import { getNearbyGeoChats } from "@/actions/getNearbyGeoChats"
import GeoChatAdminAccess from "@/components/GeoChat/GeoChatAdminAccess"
import type { NearbyGeoChat } from "@/types/geoChat"
import { MapPin, MessageCircle, Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"

type Props = {
    accuracy: number | null
    locationVersion: number
    initialAdminMode: boolean
    onAdminModeChange: (adminMode: boolean) => void
}

function formatDistance(
    distanceM: number | null,
    isApproximate: boolean
) {
    if (distanceM === null) {
        return "Расстояние неизвестно"
    }

    const prefix =
        isApproximate ? "≈ " : ""

    if (distanceM < 1000) {
        return `${prefix}${Math.max(1, Math.round(distanceM))} м`
    }

    return `${prefix}${(distanceM / 1000).toFixed(1)} км`
}

function formatRadius(
    radiusM: number
) {
    return `${Math.round(radiusM / 1000)} км`
}

function NearbyGeoChats({
    accuracy,
    locationVersion,
    initialAdminMode,
    onAdminModeChange
}: Props) {
    const [chats, setChats] =
        useState<NearbyGeoChat[]>([])

    const [adminMode, setAdminMode] =
        useState(initialAdminMode)

    const [isLoading, setIsLoading] =
        useState(true)

    const [isRefreshing, setIsRefreshing] =
        useState(false)

    const [error, setError] =
        useState("")

    const requestIdRef =
        useRef(0)

    const hasLoadedRef =
        useRef(false)

    const isApproximate =
        accuracy !== null &&
        accuracy > 1000

    const loadChats =
        useCallback(
            async (
                background = false
            ) => {
                const requestId =
                    ++requestIdRef.current

                const silentRefresh =
                    background &&
                    hasLoadedRef.current

                if (silentRefresh) {
                    setIsRefreshing(true)
                } else {
                    setIsLoading(true)
                    setError("")
                }

                try {
                    const result =
                        await getNearbyGeoChats()

                    if (
                        requestId !==
                        requestIdRef.current
                    ) {
                        return
                    }

                    if (
                        result.success ===
                        false
                    ) {
                        if (!silentRefresh) {
                            setError(
                                result.error
                            )
                        }

                        return
                    }

                    setChats(
                        result.chats
                    )

                    setAdminMode(
                        result.adminMode
                    )

                    onAdminModeChange(
                        result.adminMode
                    )

                    hasLoadedRef.current =
                        true

                    setError("")
                } catch (
                loadError
                ) {
                    if (
                        requestId !==
                        requestIdRef.current
                    ) {
                        return
                    }

                    console.error(
                        "GEO CHATS LOAD ERROR:",
                        loadError
                    )

                    if (!silentRefresh) {
                        setError(
                            "Не удалось загрузить геочаты"
                        )
                    }
                } finally {
                    if (
                        requestId ===
                        requestIdRef.current
                    ) {
                        setIsLoading(
                            false
                        )

                        setIsRefreshing(
                            false
                        )
                    }
                }
            },
            [
                onAdminModeChange
            ]
        )

    const handleAdminModeChanged =
        useCallback(
            async (
                nextAdminMode: boolean
            ) => {
                setAdminMode(
                    nextAdminMode
                )

                onAdminModeChange(
                    nextAdminMode
                )

                await loadChats(
                    false
                )
            },
            [
                loadChats,
                onAdminModeChange
            ]
        )

    useEffect(() => {
        void loadChats(
            hasLoadedRef.current
        )
    }, [
        loadChats,
        locationVersion
    ])

    return (
        <div className="overflow-hidden rounded-[18px] bg-white">
            <div className="flex items-start justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-[18px] font-bold text-[#171717]">
                            {adminMode
                                ? "Все геочаты"
                                : "Геочаты рядом"}
                        </h2>

                        {isRefreshing && (
                            <RefreshCw className="size-3.5 animate-spin text-main-green" />
                        )}
                    </div>

                    <div className="mt-1 text-[14px] text-[#999999]">
                        {adminMode
                            ? "Режим просмотра всех созданных геочатов"
                            : "Доступны в вашем текущем местоположении"}
                    </div>

                    {accuracy !==
                        null && (
                            <div className="mt-2 text-[12px] text-[#999999]">
                                {isApproximate
                                    ? `Примерное местоположение · ±${Math.max(1, Math.round(accuracy / 1000))} км`
                                    : `Точность местоположения ±${Math.round(accuracy)} м`}
                            </div>
                        )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                    <GeoChatAdminAccess
                        adminMode={
                            adminMode
                        }
                        onChanged={
                            handleAdminModeChanged
                        }
                    />

                    <Link href="/geochats/new" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                        <Plus className="size-4" />

                        <span className="hidden sm:inline">
                            Создать
                        </span>
                    </Link>
                </div>
            </div>

            <div className="border-t border-[#ededed]">
                {isLoading && (
                    <div className="flex min-h-[220] items-center justify-center">
                        <div className="flex flex-col items-center text-center">
                            <RefreshCw className="size-6 animate-spin text-main-green" />

                            <div className="mt-3 text-sm text-[#999999]">
                                Загружаем геочаты...
                            </div>
                        </div>
                    </div>
                )}

                {!isLoading &&
                    error && (
                        <div className="flex min-h-[220] items-center justify-center px-5">
                            <div className="text-center">
                                <div className="text-sm text-red-600">
                                    {error}
                                </div>

                                <button type="button" onClick={() => void loadChats(false)} className="mt-4 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#e5e5e5] px-4 text-sm font-medium text-[#616161] transition-colors hover:bg-[#f5f5f5]">
                                    <RefreshCw className="size-4" />

                                    <span>
                                        Повторить
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                {!isLoading &&
                    !error &&
                    chats.length ===
                    0 && (
                        <div className="flex min-h-[240] items-center justify-center px-5">
                            <div className="flex max-w-[420] flex-col items-center text-center">
                                <div className="flex size-14 items-center justify-center rounded-full bg-green-50 text-main-green">
                                    <MapPin className="size-6" />
                                </div>

                                <div className="mt-4 text-base font-semibold text-[#171717]">
                                    {adminMode
                                        ? "Геочатов пока нет"
                                        : "Поблизости пока нет геочатов"}
                                </div>

                                <div className="mt-2 text-sm leading-6 text-[#999999]">
                                    {adminMode
                                        ? "В сети пока не создано ни одного геочата."
                                        : "Создайте первый геочат для людей, которые находятся рядом с вами."}
                                </div>
                            </div>
                        </div>
                    )}

                {!isLoading &&
                    !error &&
                    chats.map(
                        (
                            chat,
                            index
                        ) => {
                            const isInRange =
                                chat.distanceM !==
                                null &&
                                chat.distanceM <=
                                chat.radiusM

                            return (
                                <Link
                                    key={
                                        chat.id
                                    }
                                    href={`/geochats/${chat.id}`}
                                    className={`block px-5 py-5 transition-colors hover:bg-[#fafafa] sm:px-6 ${index > 0 ? "border-t border-[#ededed]" : ""}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-green-50 text-main-green">
                                            <MessageCircle className="size-5" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                                <h3 className="truncate text-[16px] font-semibold text-[#171717]">
                                                    {
                                                        chat.name
                                                    }
                                                </h3>

                                                <div className="flex items-center gap-1 text-[12px] font-medium text-main-green">
                                                    <MapPin className="size-3.5" />

                                                    <span>
                                                        {formatDistance(
                                                            chat.distanceM,
                                                            isApproximate
                                                        )}
                                                    </span>
                                                </div>

                                                {adminMode && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${isInRange ? "bg-green-50 text-main-green" : "bg-[#f1f1f1] text-[#999999]"}`}>
                                                        {isInRange
                                                            ? "В зоне"
                                                            : "Вне зоны"}
                                                    </span>
                                                )}
                                            </div>

                                            {chat.description && (
                                                <p className="mt-1 line-clamp-2 text-[14px] leading-6 text-[#777777]">
                                                    {
                                                        chat.description
                                                    }
                                                </p>
                                            )}

                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-[#999999]">
                                                <span>
                                                    Радиус{" "}
                                                    {formatRadius(
                                                        chat.radiusM
                                                    )}
                                                </span>

                                                <span>
                                                    Создал @
                                                    {
                                                        chat.creatorUsername
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        }
                    )}
            </div>
        </div>
    )
}

export default NearbyGeoChats