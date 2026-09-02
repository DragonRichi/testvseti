"use client"

import { createPublicationsRadar } from "@/actions/createPublicationsRadar"
import { searchRadarProfiles, type RadarProfileOption } from "@/actions/searchRadarProfiles"
import { Check, LoaderCircle, Plus, Search, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

type Props = {
    suggestedProfiles: RadarProfileOption[]
}

type SortMode = "latest" | "popular" | "discussed"

const sortOptions: { value: SortMode; label: string }[] = [
    {
        value: "latest",
        label: "Сначала новые"
    },
    {
        value: "popular",
        label: "Популярные"
    },
    {
        value: "discussed",
        label: "Обсуждаемые"
    }
]

function CreatePublicationsRadar({ suggestedProfiles }: Props) {
    const router = useRouter()

    const [name, setName] = useState("")
    const [sortMode, setSortMode] = useState<SortMode>("latest")
    const [search, setSearch] = useState("")
    const [searchResults, setSearchResults] = useState<RadarProfileOption[]>([])
    const [selectedProfiles, setSelectedProfiles] = useState<RadarProfileOption[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        const normalizedSearch = search.trim()

        if (normalizedSearch.length < 2) {
            setSearchResults([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)

        const timer = window.setTimeout(async () => {
            const results = await searchRadarProfiles(normalizedSearch)

            setSearchResults(results)
            setIsSearching(false)
        }, 300)

        return () => window.clearTimeout(timer)
    }, [search])

    const isSelected = (profileId: string) => {
        return selectedProfiles.some((profile) => profile.id === profileId)
    }

    const toggleProfile = (profile: RadarProfileOption) => {
        setError(null)

        setSelectedProfiles((current) => {
            if (current.some((item) => item.id === profile.id)) {
                return current.filter((item) => item.id !== profile.id)
            }

            return [...current, profile]
        })
    }

    const handleSubmit = () => {
        if (!name.trim()) {
            setError("Введите название радара")
            return
        }

        if (selectedProfiles.length === 0) {
            setError("Выберите хотя бы один аккаунт")
            return
        }

        setError(null)

        startTransition(async () => {
            const result = await createPublicationsRadar({
                name,
                sortMode,
                profileIds: selectedProfiles.map((profile) => profile.id)
            })

            if (result.success === false) {
                setError(result.error)
                return
            }

            router.push(`/feed?radar=${result.radar.id}`)
            router.refresh()
        })
    }

    const renderProfile = (profile: RadarProfileOption) => {
        const selected = isSelected(profile.id)

        return (
            <button key={profile.id} type="button" onClick={() => toggleProfile(profile)} className="flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-green-50">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-bg-green">
                    <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="44px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-gray-900">
                        {profile.display_name}
                    </div>

                    <div className="truncate text-xs text-main-gray">
                        @{profile.username}
                    </div>
                </div>

                <div className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-colors ${selected ? "bg-main-green text-white" : "bg-green-50 text-main-green"}`}>
                    {selected ? <Check className="size-4" /> : <Plus className="size-4" />}
                </div>
            </button>
        )
    }

    return (
        <div className="rounded-3xl border border-green-100 bg-white p-5 sm:p-7">
            <div>
                <h1 className="text-xl font-bold text-gray-900">
                    Новый радар
                </h1>

                <p className="mt-1 text-sm text-main-gray">
                    Создайте отдельную ленту из публикаций выбранных аккаунтов.
                </p>
            </div>

            <div className="mt-7">
                <label className="text-sm font-semibold text-gray-900">
                    Название
                </label>

                <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Например, Интересные люди" className="mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-main-green" />
            </div>

            <div className="mt-6">
                <label className="text-sm font-semibold text-gray-900">
                    Сортировка публикаций
                </label>

                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {sortOptions.map((option) => (
                        <button key={option.value} type="button" onClick={() => setSortMode(option.value)} className={`h-11 cursor-pointer rounded-xl border px-4 text-sm font-medium transition-colors ${sortMode === option.value ? "border-main-green bg-green-50 text-main-green" : "border-gray-200 text-gray-700 hover:border-green-200 hover:bg-green-50"}`}>
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                <label className="text-sm font-semibold text-gray-900">
                    Аккаунты
                </label>

                <div className="relative mt-2">
                    <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-main-gray" />

                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Найти пользователя" className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-main-green" />

                    {isSearching && (
                        <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-main-gray" />
                    )}
                </div>

                {search.trim().length >= 2 && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-gray-100">
                        {searchResults.length > 0 ? (
                            searchResults.map(renderProfile)
                        ) : !isSearching ? (
                            <div className="px-4 py-5 text-center text-sm text-main-gray">
                                Пользователи не найдены
                            </div>
                        ) : null}
                    </div>
                )}
            </div>

            {selectedProfiles.length > 0 && (
                <div className="mt-6">
                    <div className="text-sm font-semibold text-gray-900">
                        Выбрано: {selectedProfiles.length}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedProfiles.map((profile) => (
                            <button key={profile.id} type="button" onClick={() => toggleProfile(profile)} className="flex cursor-pointer items-center gap-2 rounded-full bg-green-50 py-1.5 pl-2 pr-3 text-sm text-gray-800 transition-colors hover:bg-green-100">
                                <div className="relative size-6 overflow-hidden rounded-full bg-bg-green">
                                    <Image src={profile.avatar_url ?? "/user-avatar.svg"} alt={profile.display_name} fill sizes="24px" unoptimized={process.env.NODE_ENV === "development"} className="object-cover" />
                                </div>

                                <span className="max-w-[150] truncate">
                                    {profile.display_name}
                                </span>

                                <X className="size-3.5 text-main-gray" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {suggestedProfiles.length > 0 && (
                <div className="mt-7">
                    <div>
                        <div className="text-sm font-semibold text-gray-900">
                            Предложенные
                        </div>

                        <div className="mt-1 text-xs text-main-gray">
                            Ваши контакты
                        </div>
                    </div>

                    <div className="mt-3 grid gap-1 sm:grid-cols-2">
                        {suggestedProfiles.map(renderProfile)}
                    </div>
                </div>
            )}

            {error && (
                <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                    {error}
                </div>
            )}

            <div className="mt-7 flex justify-end">
                <button type="button" onClick={handleSubmit} disabled={isPending} className="flex h-11 min-w-[160] cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-5 text-sm font-semibold text-white transition-colors hover:bg-hover-green disabled:cursor-not-allowed disabled:opacity-60">
                    {isPending && <LoaderCircle className="size-4 animate-spin" />}
                    {isPending ? "Создание..." : "Создать радар"}
                </button>
            </div>
        </div>
    )
}

export default CreatePublicationsRadar