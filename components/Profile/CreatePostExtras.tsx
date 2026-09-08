"use client"

import PostLocationPicker, { type SelectedPostLocation } from "@/components/Post/PostLocationPicker"
import { ImagePlus, MapPin, Smile, X } from "lucide-react"
import Image from "next/image"

export type CreatePostMediaPreview = {
    previewUrl: string
}

type Props = {
    media: CreatePostMediaPreview[]
    location: SelectedPostLocation | null
    isPending: boolean
    isEmojiOpen: boolean
    maxMediaCount: number
    emojis: string[]
    onRemoveMedia: (index: number) => void
    onRemoveLocation: () => void
    onPhotoClick: () => void
    onToggleEmoji: () => void
    onEmojiSelect: (emoji: string) => void
    onLocationChange: (location: SelectedPostLocation | null) => void
}

function CreatePostExtras({ media, location, isPending, isEmojiOpen, maxMediaCount, emojis, onRemoveMedia, onRemoveLocation, onPhotoClick, onToggleEmoji, onEmojiSelect, onLocationChange }: Props) {
    return (
        <>
            {media.length > 0 && (
                <div className="mt-4">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {media.map((item, index) => (
                            <div key={item.previewUrl} className="group relative aspect-square overflow-hidden rounded-xl bg-[#f4f7f4]">
                                <Image src={item.previewUrl} alt={`Фото ${index + 1}`} fill sizes="(max-width: 640px) 50vw, 33vw" unoptimized className="object-cover" />
                                <button type="button" onClick={() => onRemoveMedia(index)} disabled={isPending} className="absolute right-2 top-2 flex size-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 disabled:pointer-events-none disabled:opacity-50">
                                    <X className="size-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 text-right text-xs text-main-gray">{media.length}/{maxMediaCount} фото</div>
                </div>
            )}

            {location && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2">
                    <MapPin className="size-4 shrink-0 text-main-green" />
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium text-gray-700">{location.name}</div></div>
                    <button type="button" onClick={onRemoveLocation} disabled={isPending} aria-label="Убрать место" title="Убрать место" className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-main-gray transition-colors hover:bg-white hover:text-red-500 disabled:pointer-events-none disabled:opacity-50">
                        <X className="size-4" />
                    </button>
                </div>
            )}

            <div className="mt-4 grid grid-cols-5 gap-1 border-t border-gray-100 pt-3">
                <button type="button" onClick={onPhotoClick} disabled={isPending || media.length >= maxMediaCount} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${media.length > 0 ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <ImagePlus className="size-5" />
                    <span className="text-xs sm:text-sm">Фото</span>
                </button>

                <button type="button" onClick={onToggleEmoji} disabled={isPending} className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-2.5 transition-colors disabled:pointer-events-none disabled:opacity-50 sm:flex-row sm:gap-2 ${isEmojiOpen ? "bg-green-50 text-main-green" : "text-main-gray hover:bg-green-50 hover:text-main-green"}`}>
                    <Smile className="size-5" />
                    <span className="text-xs sm:text-sm">Эмодзи</span>
                </button>

                <PostLocationPicker value={location} onChange={onLocationChange} variant="toolbar" disabled={isPending} />
            </div>

            {isEmojiOpen && (
                <div className="mt-2 rounded-2xl border border-green-100 bg-white p-3 shadow-sm">
                    <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                        {emojis.map((emoji, index) => (
                            <button key={`${emoji}-${index}`} type="button" onClick={() => onEmojiSelect(emoji)} disabled={isPending} className="flex aspect-square cursor-pointer items-center justify-center rounded-lg text-xl transition-colors hover:bg-green-50 disabled:pointer-events-none disabled:opacity-50">{emoji}</button>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}

export default CreatePostExtras
