"use client"

import { LoaderCircle, Save } from "lucide-react"
import Link from "next/link"
import ProfileEditFields from "./ProfileEditFields"
import ProfileEditMedia from "./ProfileEditMedia"
import type { EditableProfile } from "./profileEditTypes"
import useProfileEditForm from "./useProfileEditForm"

type Props = {
    profile: EditableProfile
}

function ProfileEditForm({
    profile
}: Props) {
    const form =
        useProfileEditForm(
            profile
        )

    return (
        <form
            onSubmit={
                form.handleSubmit
            }
            className="space-y-4"
        >
            <ProfileEditMedia
                displayName={
                    form.displayName
                }
                avatarUrl={
                    profile.avatar_url
                }
                coverUrl={
                    profile.cover_url
                }
                onAvatarChange={
                    form.handleAvatarChange
                }
                onCoverChange={
                    form.handleCoverChange
                }
                onError={
                    form.setError
                }
            />

            <div className="rounded-3xl bg-white p-5 sm:p-6">
                <div>
                    <h1 className="text-xl font-bold text-[#171717]">
                        Редактирование профиля
                    </h1>

                    <p className="mt-1 text-sm text-[#999]">
                        Изменения будут отображаться в вашем профиле и публикациях.
                    </p>
                </div>

                <ProfileEditFields
                    displayName={
                        form.displayName
                    }
                    username={
                        form.username
                    }
                    bio={form.bio}
                    birthDate={
                        form.birthDate
                    }
                    locationLabel={
                        form.locationLabel
                    }
                    websiteUrl={
                        form.websiteUrl
                    }
                    interests={
                        form.interests
                    }
                    onDisplayNameChange={(value) => {
                        form.setDisplayName(
                            value
                        )
                        form.clearError()
                    }}
                    onUsernameChange={(value) => {
                        form.setUsername(
                            value
                        )
                        form.clearError()
                    }}
                    onBioChange={(value) => {
                        form.setBio(value)
                        form.clearError()
                    }}
                    onBirthDateChange={(value) => {
                        form.setBirthDate(
                            value
                        )
                        form.clearError()
                    }}
                    onLocationChange={(value) => {
                        form.setLocationLabel(
                            value
                        )
                        form.clearError()
                    }}
                    onWebsiteChange={(value) => {
                        form.setWebsiteUrl(
                            value
                        )
                        form.clearError()
                    }}
                    onInterestsChange={(value) => {
                        form.setInterests(
                            value
                        )
                        form.clearError()
                    }}
                />

                {form.error && (
                    <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                        {form.error}
                    </div>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Link
                        href={`/profile/${profile.username}`}
                        className="flex h-11 items-center justify-center rounded-xl border border-[#dedede] bg-white px-5 text-sm font-semibold text-[#616161] transition-colors hover:bg-[#f5f5f5]"
                    >
                        Отмена
                    </Link>

                    <button
                        type="submit"
                        disabled={
                            form.isPending
                        }
                        className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-main-green px-6 text-sm font-semibold text-white transition-colors hover:bg-hover-green disabled:pointer-events-none disabled:opacity-60"
                    >
                        {form.isPending ? (
                            <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}

                        {form.isPending
                            ? "Сохраняем..."
                            : "Сохранить"}
                    </button>
                </div>
            </div>
        </form>
    )
}

export default ProfileEditForm