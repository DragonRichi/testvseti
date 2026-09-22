import Image from "next/image"

type Props = {
    userId?: string | null
    displayName?: string | null
    avatarUrl?: string | null
    size?: number
    priority?: boolean
    className?: string
    sizeClassName?: string
    textClassName?: string
}

const AVATAR_COLORS = [
    "#2563EB",
    "#7C3AED",
    "#DB2777",
    "#DC2626",
    "#EA580C",
    "#CA8A04",
    "#16A34A",
    "#0D9488",
    "#0891B2",
    "#4F46E5"
]

function getAvatarColor(
    userId: string | null | undefined,
    displayName: string | null | undefined
) {
    const source =
        userId?.trim() ||
        displayName?.trim() ||
        "user"

    let hash = 0

    for (
        let index = 0;
        index < source.length;
        index += 1
    ) {
        hash =
            (
                hash * 31 +
                source.charCodeAt(index)
            ) >>> 0
    }

    return AVATAR_COLORS[
        hash % AVATAR_COLORS.length
    ]
}

function getInitial(
    displayName: string | null | undefined
) {
    const normalized =
        displayName?.trim()

    if (!normalized) {
        return "?"
    }

    return Array.from(normalized)[0]
        ?.toLocaleUpperCase("ru-RU") ?? "?"
}

function UserAvatar({
    userId,
    displayName,
    avatarUrl,
    size = 40,
    priority = false,
    className = "",
    sizeClassName = "",
    textClassName = ""
}: Props) {
    const name =
        displayName?.trim() ||
        "Пользователь"

    const hasCustomSize =
        sizeClassName.length > 0

    const hasCustomTextSize =
        textClassName.length > 0

    return (
        <div
            className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full ${sizeClassName} ${className}`}
            style={{
                width: hasCustomSize
                    ? undefined
                    : size,
                height: hasCustomSize
                    ? undefined
                    : size,
                backgroundColor: avatarUrl
                    ? undefined
                    : getAvatarColor(
                        userId,
                        displayName
                    )
            }}
            aria-label={name}
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt={name}
                    fill
                    sizes={
                        hasCustomSize
                            ? "140px"
                            : `${size}px`
                    }
                    priority={priority}
                    unoptimized={
                        process.env.NODE_ENV ===
                        "development"
                    }
                    className="object-cover"
                />
            ) : (
                <span
                    className={`select-none font-semibold leading-none text-white ${textClassName}`}
                    style={{
                        fontSize:
                            hasCustomTextSize
                                ? undefined
                                : Math.max(
                                    12,
                                    Math.round(
                                        size * 0.42
                                    )
                                )
                    }}
                >
                    {getInitial(
                        displayName
                    )}
                </span>
            )}
        </div>
    )
}

export default UserAvatar