"use client"

import GeoChatAdminAccess from "@/components/GeoChat/GeoChatAdminAccess"
import type { GeoChatLocationStatus } from "@/components/GeoChat/useGeoChatLocationTracking"
import { LocateFixed, MapPin, RefreshCw, Settings, Shield, TriangleAlert } from "lucide-react"

type Props = {
    status: GeoChatLocationStatus
    error: string
    onStart: () => void
    onRetry: () => void
    onAdminModeChange: (adminMode: boolean) => void
}

function GeoChatLocationState({ status, error, onStart, onRetry, onAdminModeChange }: Props) {
    if (status === "checking") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white">
                <RefreshCw className="size-6 animate-spin text-main-green" />
            </div>
        )
    }

    if (status === "requesting") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="text-center">
                    <LocateFixed className="mx-auto size-8 animate-pulse text-main-green" />
                    <div className="mt-4 font-semibold text-gray-900">Определяем ваше местоположение</div>
                    <div className="mt-2 text-sm text-main-gray">Получаем актуальную геопозицию устройства.</div>
                </div>
            </div>
        )
    }

    if (status === "prompt") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-green-100 bg-white px-5">
                <div className="max-w-[460] text-center">
                    <MapPin className="mx-auto size-8 text-main-green" />
                    <h2 className="mt-4 text-xl font-bold text-gray-900">Найдём геочаты рядом</h2>
                    <p className="mt-2 text-sm leading-6 text-main-gray">Разрешите доступ к местоположению, чтобы увидеть доступные геочаты.</p>

                    <button type="button" onClick={onStart} className="mt-5 h-11 cursor-pointer rounded-xl bg-main-green px-5 text-sm font-medium text-white hover:bg-hover-green">
                        Разрешить местоположение
                    </button>
                </div>
            </div>
        )
    }

    if (status === "denied") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 py-10">
                <div className="flex max-w-[500] flex-col items-center text-center">
                    <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <Settings className="size-7" />
                    </div>

                    <h2 className="mt-5 text-xl font-bold text-gray-900">Доступ к геолокации запрещён</h2>
                    <p className="mt-2 text-sm leading-6 text-main-gray">Чтобы пользоваться обычными геочатами, разрешите ВСети доступ к местоположению.</p>

                    <button type="button" onClick={onRetry} className="mt-5 flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-green-200 px-5 text-sm font-medium text-main-green hover:bg-green-50">
                        <RefreshCw className="size-4" />
                        <span>Проверить снова</span>
                    </button>

                    <div className="my-6 h-px w-full bg-gray-100" />

                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Shield className="size-4 text-main-green" />
                        <span>Режим администратора</span>
                    </div>

                    <div className="mt-2 text-xs leading-5 text-main-gray">Для просмотра всех геочатов местоположение не требуется.</div>

                    <div className="mt-4">
                        <GeoChatAdminAccess adminMode={false} onChanged={onAdminModeChange} />
                    </div>
                </div>
            </div>
        )
    }

    if (status === "unsupported") {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-center">
                <div>
                    <TriangleAlert className="mx-auto size-8 text-red-500" />
                    <div className="mt-4 font-semibold text-gray-900">Геолокация недоступна</div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-red-100 bg-white px-5 text-center">
            <div>
                <TriangleAlert className="mx-auto size-8 text-red-500" />
                <div className="mt-4 font-semibold text-gray-900">Не удалось определить местоположение</div>
                <div className="mt-2 text-sm text-main-gray">{error || "Попробуйте ещё раз"}</div>

                <button type="button" onClick={onRetry} className="mt-5 h-10 cursor-pointer rounded-xl border border-green-200 px-4 text-sm font-medium text-main-green hover:bg-green-50">
                    Попробовать снова
                </button>
            </div>
        </div>
    )
}

export default GeoChatLocationState
