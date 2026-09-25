"use client"

import ProfileBirthDatePicker from "./ProfileBirthDatePicker"
import ProfileInterestsEditor from "./ProfileInterestsEditor"

type Props = {
    displayName: string
    username: string
    bio: string
    birthDate: string
    locationLabel: string
    websiteUrl: string
    interests: string[]
    onDisplayNameChange: (
        value: string
    ) => void
    onUsernameChange: (
        value: string
    ) => void
    onBioChange: (
        value: string
    ) => void
    onBirthDateChange: (
        value: string
    ) => void
    onLocationChange: (
        value: string
    ) => void
    onWebsiteChange: (
        value: string
    ) => void
    onInterestsChange: (
        value: string[]
    ) => void
}

const inputClassName =
    "h-11 w-full rounded-xl border border-[#e2e2e2] bg-white px-3 text-sm text-[#202020] outline-none transition-colors focus:border-main-green"

function ProfileEditFields({
    displayName,
    username,
    bio,
    birthDate,
    locationLabel,
    websiteUrl,
    interests,
    onDisplayNameChange,
    onUsernameChange,
    onBioChange,
    onBirthDateChange,
    onLocationChange,
    onWebsiteChange,
    onInterestsChange
}: Props) {
    return (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Имя
                </span>

                <input
                    value={displayName}
                    onChange={(event) =>
                        onDisplayNameChange(
                            event.target.value
                        )
                    }
                    maxLength={50}
                    className={inputClassName}
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Имя пользователя
                </span>

                <div className="flex h-11 overflow-hidden rounded-xl border border-[#e2e2e2] bg-white focus-within:border-main-green">
                    <span className="flex items-center pl-3 text-sm text-[#999]">
                        @
                    </span>

                    <input
                        value={username}
                        onChange={(event) =>
                            onUsernameChange(
                                event.target.value
                                    .replace(
                                        /^@+/,
                                        ""
                                    )
                                    .toLowerCase()
                            )
                        }
                        maxLength={20}
                        className="min-w-0 flex-1 border-0 bg-transparent px-1 pr-3 text-sm outline-none"
                    />
                </div>
            </label>

            <label className="block sm:col-span-2">
                <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[#444]">
                        О себе
                    </span>

                    <span className="text-xs text-[#aaa]">
                        {bio.length}/500
                    </span>
                </div>

                <textarea
                    value={bio}
                    onChange={(event) =>
                        onBioChange(
                            event.target.value
                        )
                    }
                    maxLength={500}
                    rows={5}
                    className="min-h-[120] w-full resize-none rounded-xl border border-[#e2e2e2] bg-white px-3 py-3 text-sm leading-6 text-[#202020] outline-none transition-colors focus:border-main-green"
                />
            </label>

            <label className="block">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Местоположение
                </span>

                <input
                    value={
                        locationLabel
                    }
                    onChange={(event) =>
                        onLocationChange(
                            event.target.value
                        )
                    }
                    maxLength={100}
                    placeholder="Например, Минск"
                    className={
                        inputClassName
                    }
                />
            </label>

            <div className="block">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Дата рождения
                </span>

                <ProfileBirthDatePicker
                    value={birthDate}
                    onChange={
                        onBirthDateChange
                    }
                />
            </div>

            <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Сайт
                </span>

                <input
                    value={websiteUrl}
                    onChange={(event) =>
                        onWebsiteChange(
                            event.target.value
                        )
                    }
                    maxLength={250}
                    placeholder="vseti.by"
                    className={
                        inputClassName
                    }
                />
            </label>

            <div className="sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-[#444]">
                    Интересы
                </span>

                <ProfileInterestsEditor
                    value={interests}
                    onChange={
                        onInterestsChange
                    }
                />
            </div>
        </div>
    )
}

export default ProfileEditFields