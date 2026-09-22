"use client"

import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import GeoChatImageViewer from "./GeoChatImageViewer"

type Props = {
    attachments: GeoChatMessageAttachment[]
    expectedCount?: number
    eager?: boolean
}

type AttachmentImageProps = {
    attachment: GeoChatMessageAttachment
    sizes: string
    eager: boolean
}

function AttachmentImage({
    attachment,
    sizes,
    eager
}: AttachmentImageProps) {
    const [loaded, setLoaded] =
        useState(false)

    useEffect(() => {
        setLoaded(false)
    }, [attachment.url])

    if (!attachment.url) {
        return (
            <div className="absolute inset-0 animate-pulse bg-gray-100" />
        )
    }

    return (
        <>
            <div className={`absolute inset-0 bg-gray-100 transition-opacity duration-300 ${loaded ? "pointer-events-none opacity-0" : "animate-pulse opacity-100"}`} />

            <Image
                src={attachment.url}
                alt={attachment.fileName}
                fill
                sizes={sizes}
                loading={
                    eager
                        ? "eager"
                        : "lazy"
                }
                unoptimized
                onLoad={() =>
                    setLoaded(true)
                }
                className={`object-cover transition-opacity duration-300 ease-out ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </>
    )
}

function GeoChatMessageAttachments({
    attachments,
    expectedCount = 0,
    eager = false
}: Props) {
    const [
        activeIndex,
        setActiveIndex
    ] =
        useState<number | null>(null)

    const viewerUrls =
        useMemo(
            () =>
                attachments.flatMap(
                    (attachment) =>
                        attachment.url
                            ? [
                                attachment.url
                            ]
                            : []
                ),
            [attachments]
        )

    const count = Math.min(
        5,
        Math.max(
            expectedCount,
            attachments.length
        )
    )

    if (count === 0) {
        return null
    }

    const openAttachment = (
        attachment:
            GeoChatMessageAttachment
    ) => {
        if (!attachment.url) return

        const index =
            viewerUrls.indexOf(
                attachment.url
            )

        if (index === -1) return

        setActiveIndex(index)
    }

    let content:
        React.ReactNode

    if (count === 1) {
        const attachment =
            attachments[0]

        content = (
            <div className="relative block aspect-4/3 w-[72vw] max-w-95 overflow-hidden rounded-2xl bg-gray-100 sm:w-90">
                {attachment?.url ? (
                    <button type="button" onClick={() => openAttachment(attachment)} aria-label="Открыть изображение" className="absolute inset-0 cursor-pointer">
                        <AttachmentImage
                            attachment={
                                attachment
                            }
                            sizes="(max-width: 640px) 72vw, 360px"
                            eager={eager}
                        />
                    </button>
                ) : attachment ? (
                    <AttachmentImage
                        attachment={
                            attachment
                        }
                        sizes="(max-width: 640px) 72vw, 360px"
                        eager={eager}
                    />
                ) : (
                    <div className="absolute inset-0 animate-pulse bg-gray-100" />
                )}
            </div>
        )
    } else {
        content = (
            <div className="grid w-[72vw] max-w-95 grid-cols-2 gap-1.5 overflow-hidden rounded-2xl sm:w-90">
                {Array.from({
                    length: count
                }).map(
                    (_, index) => {
                        const attachment =
                            attachments[
                            index
                            ]

                        if (
                            !attachment
                        ) {
                            return (
                                <div
                                    key={`placeholder-${index}`}
                                    className="relative aspect-square overflow-hidden bg-gray-100"
                                >
                                    <div className="absolute inset-0 animate-pulse bg-gray-100" />
                                </div>
                            )
                        }

                        if (
                            !attachment.url
                        ) {
                            return (
                                <div
                                    key={
                                        attachment.id
                                    }
                                    className="relative aspect-square overflow-hidden bg-gray-100"
                                >
                                    <AttachmentImage
                                        attachment={
                                            attachment
                                        }
                                        sizes="(max-width: 640px) 36vw, 180px"
                                        eager={
                                            eager
                                        }
                                    />
                                </div>
                            )
                        }

                        return (
                            <button
                                key={
                                    attachment.id
                                }
                                type="button"
                                onClick={() =>
                                    openAttachment(
                                        attachment
                                    )
                                }
                                aria-label={`Открыть изображение ${index + 1}`}
                                className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
                            >
                                <AttachmentImage
                                    attachment={
                                        attachment
                                    }
                                    sizes="(max-width: 640px) 36vw, 180px"
                                    eager={
                                        eager
                                    }
                                />
                            </button>
                        )
                    }
                )}
            </div>
        )
    }

    return (
        <>
            {content}

            <GeoChatImageViewer
                urls={viewerUrls}
                activeIndex={
                    activeIndex
                }
                onChange={
                    setActiveIndex
                }
                onClose={() =>
                    setActiveIndex(
                        null
                    )
                }
            />
        </>
    )
}

export default GeoChatMessageAttachments