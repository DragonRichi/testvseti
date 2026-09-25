"use client"

import { Camera, ImagePlus, Trash2 } from "lucide-react"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

type Props = {
    displayName: string
    avatarUrl: string | null
    coverUrl: string | null
    onAvatarChange: (file: File | null, remove: boolean) => void
    onCoverChange: (file: File | null, remove: boolean) => void
    onError: (message: string) => void
}

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
]

function ProfileEditMedia({
    displayName,
    avatarUrl,
    coverUrl,
    onAvatarChange,
    onCoverChange,
    onError
}: Props) {
    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const avatarBlobRef = useRef<string | null>(null)
    const coverBlobRef = useRef<string | null>(null)

    const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl)
    const [coverPreview, setCoverPreview] = useState<string | null>(coverUrl)

    useEffect(() => {
        return () => {
            if (avatarBlobRef.current) {
                URL.revokeObjectURL(avatarBlobRef.current)
            }

            if (coverBlobRef.current) {
                URL.revokeObjectURL(coverBlobRef.current)
            }
        }
    }, [])

    const applyFile = (
        file: File,
        kind: "avatar" | "cover"
    ) => {
        if (!ALLOWED_TYPES.includes(file.type)) {
            onError("Поддерживаются JPG, PNG и WEBP")
            return
        }

        const maxSize =
            kind === "avatar"
                ? 5 * 1024 * 1024
                : 10 * 1024 * 1024

        if (file.size > maxSize) {
            onError(
                kind === "avatar"
                    ? "Аватар не должен превышать 5 МБ"
                    : "Обложка не должна превышать 10 МБ"
            )
            return
        }

        const previewUrl = URL.createObjectURL(file)

        if (kind === "avatar") {
            if (avatarBlobRef.current) {
                URL.revokeObjectURL(avatarBlobRef.current)
            }

            avatarBlobRef.current = previewUrl
            setAvatarPreview(previewUrl)
            onAvatarChange(file, false)
            return
        }

        if (coverBlobRef.current) {
            URL.revokeObjectURL(coverBlobRef.current)
        }

        coverBlobRef.current = previewUrl
        setCoverPreview(previewUrl)
        onCoverChange(file, false)
    }

    const handleRemoveAvatar = () => {
        if (avatarBlobRef.current) {
            URL.revokeObjectURL(avatarBlobRef.current)
            avatarBlobRef.current = null
        }

        setAvatarPreview(null)
        onAvatarChange(null, true)
    }

    const handleRemoveCover = () => {
        if (coverBlobRef.current) {
            URL.revokeObjectURL(coverBlobRef.current)
            coverBlobRef.current = null
        }

        setCoverPreview(null)
        onCoverChange(null, true)
    }

    return (
        <div className="relative overflow-hidden rounded-3xl bg-white">
            <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                        applyFile(file, "avatar")
                    }

                    event.target.value = ""
                }}
                className="hidden"
            />

            <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                    const file = event.target.files?.[0]

                    if (file) {
                        applyFile(file, "cover")
                    }

                    event.target.value = ""
                }}
                className="hidden"
            />

            <div className="relative h-[165] overflow-hidden bg-[#e7eae7]">
                {coverPreview ? (
                    <Image
                        src={coverPreview}
                        alt="Обложка профиля"
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 800px"
                        unoptimized
                        draggable={false}
                        className="pointer-events-none select-none object-cover"
                    />
                ) : (
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-[#dfeee1] via-[#eef3ee] to-[#dce9e2]" />
                )}
            </div>

            <div className="relative px-5 pb-5 sm:px-6">
                <div className="pointer-events-none -mt-10 flex items-end gap-4">
                    <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        aria-label="Изменить фото профиля"
                        className="group pointer-events-auto relative size-[92] shrink-0 cursor-pointer overflow-hidden rounded-full border-4 border-white bg-[#e7eae7] shadow-sm"
                    >
                        {avatarPreview ? (
                            <Image
                                src={avatarPreview}
                                alt={displayName}
                                fill
                                sizes="92px"
                                unoptimized
                                draggable={false}
                                className="pointer-events-none select-none object-cover"
                            />
                        ) : (
                            <div className="pointer-events-none flex h-full w-full items-center justify-center text-3xl font-semibold text-[#777]">
                                {displayName.trim().charAt(0).toUpperCase() || "?"}
                            </div>
                        )}

                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 text-white transition-colors group-hover:bg-black/30">
                            <Camera className="size-5 opacity-0 transition-opacity group-hover:opacity-100" />
                        </span>
                    </button>

                    <div className="pointer-events-auto flex min-w-0 flex-1 items-center justify-between gap-3 pb-1">
                        <div>
                            <div className="text-sm font-semibold text-[#202020]">
                                Фото профиля
                            </div>

                            <div className="mt-1 text-xs text-[#999]">
                                JPG, PNG или WEBP
                            </div>
                        </div>

                        {avatarPreview && (
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50"
                            >
                                Удалить
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {coverPreview && (
                <button
                    type="button"
                    onClick={handleRemoveCover}
                    aria-label="Удалить обложку"
                    title="Удалить обложку"
                    className="absolute left-3 top-3 z-50 flex size-10 cursor-pointer items-center justify-center rounded-xl bg-white text-red-500 shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-red-50"
                >
                    <Trash2 className="pointer-events-none size-4" />
                </button>
            )}

            <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="absolute right-3 top-[113] z-50 flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-white px-4 text-sm font-medium text-[#555] shadow-[0_2px_10px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#f7f7f7] hover:text-[#202020]"
            >
                <ImagePlus className="pointer-events-none size-4" />

                <span className="pointer-events-none">
                    Изменить обложку
                </span>
            </button>
        </div>
    )
}

export default ProfileEditMedia