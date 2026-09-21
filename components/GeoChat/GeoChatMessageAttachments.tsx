"use client"

import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import Image from "next/image"
import { useState } from "react"

type Props = {
    attachments: GeoChatMessageAttachment[]
    expectedCount?: number
}

type ImageProps = {
    attachment: GeoChatMessageAttachment
    sizes: string
}

function AttachmentImage({
    attachment,
    sizes
}: ImageProps) {
    const [loaded, setLoaded] =
        useState(false)

    if (!attachment.url) {
        return (
            <div className="absolute inset-0 animate-pulse bg-gray-100" />
        )
    }

    return (
        <>
            <div className={`absolute inset-0 bg-gray-100 transition-opacity duration-200 ${loaded ? "opacity-0" : "animate-pulse opacity-100"}`} />

            <Image
                src={attachment.url}
                alt={attachment.fileName}
                fill
                sizes={sizes}
                unoptimized
                onLoad={() =>
                    setLoaded(true)
                }
                className={`object-cover transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
        </>
    )
}

function GeoChatMessageAttachments({
    attachments,
    expectedCount = 0
}: Props) {
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

    if (count === 1) {
        const attachment =
            attachments[0]

        if (!attachment?.url) {
            return (
                <div className="relative block aspect-4/3 w-[72vw] max-w-95 overflow-hidden rounded-2xl bg-gray-100 sm:w-90">
                    {attachment ? (
                        <AttachmentImage
                            attachment={
                                attachment
                            }
                            sizes="(max-width: 640px) 72vw, 360px"
                        />
                    ) : (
                        <div className="absolute inset-0 animate-pulse bg-gray-100" />
                    )}
                </div>
            )
        }

        return (
            <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="relative block aspect-4/3 w-[72vw] max-w-95 overflow-hidden rounded-2xl bg-gray-100 sm:w-90"
            >
                <AttachmentImage
                    attachment={attachment}
                    sizes="(max-width: 640px) 72vw, 360px"
                />
            </a>
        )
    }

    return (
        <div className="grid w-[72vw] max-w-95 grid-cols-2 gap-1.5 overflow-hidden rounded-2xl sm:w-90">
            {Array.from({
                length: count
            }).map((_, index) => {
                const attachment =
                    attachments[index]

                if (!attachment?.url) {
                    return (
                        <div
                            key={
                                attachment?.id ??
                                `placeholder-${index}`
                            }
                            className="relative aspect-square overflow-hidden bg-gray-100"
                        >
                            {attachment ? (
                                <AttachmentImage
                                    attachment={
                                        attachment
                                    }
                                    sizes="(max-width: 640px) 36vw, 180px"
                                />
                            ) : (
                                <div className="absolute inset-0 animate-pulse bg-gray-100" />
                            )}
                        </div>
                    )
                }

                return (
                    <a
                        key={
                            attachment.id
                        }
                        href={
                            attachment.url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden bg-gray-100"
                    >
                        <AttachmentImage
                            attachment={
                                attachment
                            }
                            sizes="(max-width: 640px) 36vw, 180px"
                        />
                    </a>
                )
            })}
        </div>
    )
}

export default GeoChatMessageAttachments