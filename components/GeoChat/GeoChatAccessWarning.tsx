"use client"

import { MapPin, RefreshCw } from "lucide-react"
import Link from "next/link"

export type GeoChatAccessStatus = "checking" | "active" | "outside" | "denied" | "unsupported" | "error"

type Props = {
    status: GeoChatAccessStatus
    error: string | null
}

function GeoChatAccessWarning({ status, error }: Props) {
    if (status === "active") return null

    return (
        <div className="shrink-0 border-t border-gray-100 bg-white px-2 pt-2 sm:px-4 sm:pt-3">
            <div className={`rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 ${status === "outside" ? "bg-amber-50" : status === "checking" ? "bg-gray-50" : "bg-red-50"}`}>
                <div className="flex items-start gap-2.5">
                    {status === "checking" ? (
                        <RefreshCw className="mt-0.5 size-4 shrink-0 animate-spin text-main-green" />
                    ) : (
                        <MapPin className={`mt-0.5 size-4 shrink-0 ${status === "outside" ? "text-amber-600" : "text-red-500"}`} />
                    )}

                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                            {status === "checking" && "Проверяем местоположение"}
                            {status === "outside" && "Вы вышли из зоны геочата"}
                            {status === "denied" && "Доступ к геолокации запрещён"}
                            {status === "unsupported" && "Геолокация недоступна"}
                            {status === "error" && "Не удалось проверить местоположение"}
                        </div>

                        <div className="mt-1 text-xs leading-5 text-main-gray">
                            {status === "checking" && "Проверяем, находитесь ли вы в зоне этого геочата."}
                            {status === "outside" && "Отправка сообщений временно недоступна. Вернитесь в зону геочата, и отправка включится автоматически."}
                            {status === "denied" && "Разрешите ВСети доступ к местоположению в настройках браузера или телефона."}
                            {status === "unsupported" && "На этом устройстве невозможно получить текущее местоположение."}
                            {status === "error" && (error || "Не удалось получить актуальную геопозицию.")}
                        </div>

                        {status !== "checking" && (
                            <Link href="/geochats" className="mt-1.5 inline-flex text-xs font-semibold text-main-green hover:underline">
                                Вернуться к геочатам
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default GeoChatAccessWarning
