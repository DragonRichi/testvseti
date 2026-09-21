"use client"

import type { GeoChatMessageAttachment } from "@/types/geoChatAttachments"
import Image from "next/image"

type Props = {
    attachments: GeoChatMessageAttachment[]
}

function GeoChatMessageAttachments({
    attachments
}: Props) {
    const visibleAttachments =
        attachments.filter(
            (
                attachment
            ): attachment is GeoChatMessageAttachment & {
                url: string
            } => Boolean(attachment.url)
        )

    if (
        visibleAttachments.length === 0
    ) {
        return null
    }

    if (
        visibleAttachments.length === 1
    ) {
        const attachment =
            visibleAttachments[0]

        return (
            <a
                href={attachment.url}
                target="_blank"
                rel="noreferrer"
                className="relative mt-2 block aspect-4/3 w-full max-w-[420] overflow-hidden rounded-2xl bg-gray-100"
            >
                <Image
                    src={attachment.url}
                    alt={attachment.fileName}
                    fill
                    sizes="(max-width: 640px) 75vw, 420px"
                    unoptimized
                    className="object-cover transition-transform duration-200 hover:scale-[1.01]"
                />
            </a>
        )
    }

    return (
        <div className="mt-2 grid max-w-[420] grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
            {visibleAttachments.map(
                (attachment) => (
                    <a
                        key={attachment.id}
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square min-w-0 overflow-hidden bg-gray-100"
                    >
                        <Image
                            src={attachment.url}
                            alt={attachment.fileName}
                            fill
                            sizes="(max-width: 640px) 38vw, 205px"
                            unoptimized
                            className="object-cover transition-transform duration-200 hover:scale-[1.02]"
                        />
                    </a>
                )
            )}
        </div>
    )
}

export default GeoChatMessageAttachments