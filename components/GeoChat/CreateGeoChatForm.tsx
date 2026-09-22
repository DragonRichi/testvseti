"use client"

import { createGeoChat } from "@/actions/createGeoChat"
import { syncPreciseLocation } from "@/actions/syncPreciseLocation"
import type { GeoChatRadius } from "@/types/geoChat"
import {
    LocateFixed,
    MapPin,
    RefreshCw
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react"

type LocationStatus =
    | "checking"
    | "ready"
    | "denied"
    | "unsupported"
    | "error"

const radii: {
    value: GeoChatRadius
    label: string
}[] = [
        {
            value: 3000,
            label: "3 км"
        },
        {
            value: 6000,
            label: "6 км"
        },
        {
            value: 9000,
            label: "9 км"
        },
        {
            value: 12000,
            label: "12 км"
        }
    ]

function getCurrentPosition() {
    return new Promise<GeolocationPosition>(
        (
            resolve,
            reject
        ) => {
            navigator.geolocation
                .getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy:
                            true,
                        timeout: 12000,
                        maximumAge: 0
                    }
                )
        }
    )
}

function CreateGeoChatForm() {
    const router = useRouter()

    const [name, setName] =
        useState("")

    const [
        description,
        setDescription
    ] =
        useState("")

    const [
        radiusM,
        setRadiusM
    ] =
        useState<GeoChatRadius>(
            3000
        )

    const [
        locationStatus,
        setLocationStatus
    ] =
        useState<LocationStatus>(
            "checking"
        )

    const [
        accuracy,
        setAccuracy
    ] =
        useState<number | null>(
            null
        )

    const [
        locationError,
        setLocationError
    ] =
        useState("")

    const [
        isSubmitting,
        setIsSubmitting
    ] =
        useState(false)

    const [error, setError] =
        useState("")

    const locationRequestRef =
        useRef<
            Promise<boolean> | null
        >(null)

    const syncCurrentLocation =
        useCallback(() => {
            if (
                locationRequestRef.current
            ) {
                return locationRequestRef.current
            }

            const request =
                (async () => {
                    if (
                        !navigator.geolocation
                    ) {
                        setLocationStatus(
                            "unsupported"
                        )

                        setLocationError(
                            "На этом устройстве геолокация недоступна"
                        )

                        return false
                    }

                    setLocationStatus(
                        "checking"
                    )

                    setLocationError("")

                    try {
                        const position =
                            await getCurrentPosition()

                        const nextAccuracy =
                            position.coords
                                .accuracy

                        const result =
                            await syncPreciseLocation(
                                {
                                    latitude:
                                        position
                                            .coords
                                            .latitude,
                                    longitude:
                                        position
                                            .coords
                                            .longitude,
                                    accuracy:
                                        Number.isFinite(
                                            nextAccuracy
                                        )
                                            ? nextAccuracy
                                            : null
                                }
                            )

                        if (
                            result.success ===
                            false
                        ) {
                            setLocationStatus(
                                "error"
                            )

                            setLocationError(
                                result.error
                            )

                            return false
                        }

                        setAccuracy(
                            Number.isFinite(
                                nextAccuracy
                            )
                                ? nextAccuracy
                                : null
                        )

                        setLocationStatus(
                            "ready"
                        )

                        return true
                    } catch (error) {
                        const positionError =
                            error as
                            GeolocationPositionError

                        if (
                            positionError.code ===
                            positionError.PERMISSION_DENIED
                        ) {
                            setLocationStatus(
                                "denied"
                            )

                            setLocationError(
                                "Разрешите доступ к местоположению"
                            )

                            return false
                        }

                        setLocationStatus(
                            "error"
                        )

                        setLocationError(
                            positionError.code ===
                                positionError.TIMEOUT
                                ? "Не удалось определить местоположение вовремя"
                                : "Не удалось определить текущее местоположение"
                        )

                        return false
                    }
                })()

            locationRequestRef.current =
                request

            void request.finally(
                () => {
                    if (
                        locationRequestRef.current ===
                        request
                    ) {
                        locationRequestRef.current =
                            null
                    }
                }
            )

            return request
        }, [])

    useEffect(() => {
        void syncCurrentLocation()
    }, [
        syncCurrentLocation
    ])

    const handleSubmit =
        async () => {
            if (isSubmitting) {
                return
            }

            setError("")
            setIsSubmitting(true)

            try {
                /*
                 * Перед созданием ещё раз
                 * получаем именно свежую
                 * геопозицию пользователя.
                 */
                const locationReady =
                    await syncCurrentLocation()

                if (!locationReady) {
                    return
                }

                const result =
                    await createGeoChat(
                        name,
                        description,
                        radiusM
                    )

                if (
                    result.success ===
                    false
                ) {
                    setError(
                        result.error
                    )

                    return
                }

                router.push(
                    `/geochats/${result.chatId}`
                )

                router.refresh()
            } catch (error) {
                console.error(
                    "CREATE GEO CHAT ERROR:",
                    error
                )

                setError(
                    "Не удалось создать геочат"
                )
            } finally {
                setIsSubmitting(
                    false
                )
            }
        }

    return (
        <div className="space-y-5">
            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <label className="block text-sm font-semibold text-gray-900">
                    Название
                </label>

                <input
                    value={name}
                    onChange={(event) =>
                        setName(
                            event.target
                                .value
                        )
                    }
                    maxLength={80}
                    placeholder="Например, Центр Гродно"
                    className="mt-2 h-11 w-full rounded-xl border border-gray-200 px-4 text-[16px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-main-green lg:text-sm"
                />

                <div className="mt-5 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-900">
                        Описание
                    </label>

                    <span className="text-xs text-main-gray">
                        {
                            description.length
                        }
                        /500
                    </span>
                </div>

                <textarea
                    value={description}
                    onChange={(event) =>
                        setDescription(
                            event.target
                                .value
                        )
                    }
                    maxLength={500}
                    placeholder="О чём этот геочат?"
                    className="mt-2 min-h-[100] w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-[16px] leading-6 text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-main-green lg:text-sm"
                />
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-gray-900">
                    Местоположение
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-2xl bg-green-50 px-4 py-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-main-green">
                        {locationStatus ===
                            "checking" ? (
                            <RefreshCw className="size-5 animate-spin" />
                        ) : (
                            <MapPin className="size-5" />
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-gray-900">
                            {locationStatus ===
                                "ready"
                                ? "Текущее местоположение определено"
                                : locationStatus ===
                                    "checking"
                                    ? "Определяем ваше местоположение..."
                                    : "Не удалось определить местоположение"}
                        </div>

                        <div className="mt-0.5 text-xs leading-5 text-main-gray">
                            {locationStatus ===
                                "ready"
                                ? accuracy !==
                                    null
                                    ? `Центр геочата будет создан автоматически. Точность около ${Math.round(accuracy)} м.`
                                    : "Центр геочата будет создан автоматически по вашей текущей геопозиции."
                                : locationError ||
                                "Для создания геочата необходима текущая геопозиция."}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            void syncCurrentLocation()
                        }
                        disabled={
                            locationStatus ===
                            "checking"
                        }
                        aria-label="Обновить местоположение"
                        title="Обновить местоположение"
                        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-main-green transition-colors hover:bg-green-100 disabled:pointer-events-none disabled:opacity-50"
                    >
                        <LocateFixed className="size-4" />
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border border-green-100 bg-white p-5 sm:p-6">
                <div className="text-sm font-semibold text-gray-900">
                    Радиус геочата
                </div>

                <div className="mt-1 text-xs leading-5 text-main-gray">
                    Выберите территорию общения. Центр изменить вручную нельзя — используется ваше текущее местоположение.
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {radii.map(
                        (radius) => (
                            <button
                                key={
                                    radius.value
                                }
                                type="button"
                                onClick={() => {
                                    setRadiusM(
                                        radius.value
                                    )

                                    setError(
                                        ""
                                    )
                                }}
                                className={`h-10 cursor-pointer rounded-xl border text-sm font-medium transition-colors ${radiusM === radius.value ? "border-main-green bg-green-50 text-main-green" : "border-gray-200 bg-white text-main-gray hover:bg-gray-50"}`}
                            >
                                {
                                    radius.label
                                }
                            </button>
                        )
                    )}
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-600">
                    {error}
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() =>
                        router.back()
                    }
                    disabled={
                        isSubmitting
                    }
                    className="h-11 cursor-pointer rounded-xl border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Отмена
                </button>

                <button
                    type="button"
                    onClick={() =>
                        void handleSubmit()
                    }
                    disabled={
                        isSubmitting ||
                        !name.trim() ||
                        locationStatus !==
                        "ready"
                    }
                    className="h-11 cursor-pointer rounded-xl bg-main-green px-6 text-sm font-medium text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting
                        ? "Создаём..."
                        : "Создать геочат"}
                </button>
            </div>
        </div>
    )
}

export default CreateGeoChatForm