"use client"

import { updateProfile } from "@/actions/updateProfile"
import { useRouter } from "next/navigation"
import { FormEvent, useRef, useState } from "react"
import {
    removeProfileMedia,
    uploadProfileMedia
} from "./profileMediaClient"
import type { EditableProfile } from "./profileEditTypes"

function useProfileEditForm(
    profile: EditableProfile
) {
    const router =
        useRouter()

    const submitLockRef =
        useRef(false)

    const [
        displayName,
        setDisplayName
    ] = useState(
        profile.display_name
    )

    const [
        username,
        setUsername
    ] = useState(
        profile.username
    )

    const [
        bio,
        setBio
    ] = useState(
        profile.bio ?? ""
    )

    const [
        birthDate,
        setBirthDate
    ] = useState(
        profile.birth_date ?? ""
    )

    const [
        locationLabel,
        setLocationLabel
    ] = useState(
        profile.location_label ?? ""
    )

    const [
        websiteUrl,
        setWebsiteUrl
    ] = useState(
        profile.website_url ?? ""
    )

    const [
        interests,
        setInterests
    ] = useState<string[]>(
        profile.interests ?? []
    )

    const [
        avatarFile,
        setAvatarFile
    ] = useState<File | null>(
        null
    )

    const [
        coverFile,
        setCoverFile
    ] = useState<File | null>(
        null
    )

    const [
        removeAvatar,
        setRemoveAvatar
    ] = useState(false)

    const [
        removeCover,
        setRemoveCover
    ] = useState(false)

    const [
        isPending,
        setIsPending
    ] = useState(false)

    const [
        error,
        setError
    ] = useState("")

    const clearError = () => {
        setError("")
    }

    const handleAvatarChange = (
        file: File | null,
        remove: boolean
    ) => {
        setAvatarFile(file)
        setRemoveAvatar(remove)
        clearError()
    }

    const handleCoverChange = (
        file: File | null,
        remove: boolean
    ) => {
        setCoverFile(file)
        setRemoveCover(remove)
        clearError()
    }

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault()

        if (
            submitLockRef.current
        ) {
            return
        }

        submitLockRef.current =
            true

        setIsPending(true)
        setError("")

        const uploadedPaths:
            string[] = []

        try {
            let avatarUrl =
                removeAvatar
                    ? null
                    : profile.avatar_url

            let coverUrl =
                removeCover
                    ? null
                    : profile.cover_url

            if (avatarFile) {
                const uploaded =
                    await uploadProfileMedia(
                        "avatar",
                        avatarFile
                    )

                avatarUrl =
                    uploaded.url

                uploadedPaths.push(
                    uploaded.path
                )
            }

            if (coverFile) {
                const uploaded =
                    await uploadProfileMedia(
                        "cover",
                        coverFile
                    )

                coverUrl =
                    uploaded.url

                uploadedPaths.push(
                    uploaded.path
                )
            }

            const result =
                await updateProfile({
                    displayName,
                    username,
                    bio,
                    birthDate,
                    locationLabel,
                    websiteUrl,
                    interests,
                    avatarUrl,
                    coverUrl
                })

            if (
                result.success ===
                false
            ) {
                await Promise.all(
                    uploadedPaths.map(
                        removeProfileMedia
                    )
                )

                setError(
                    result.error
                )

                return
            }

            router.push(
                `/profile/${result.username}`
            )

            router.refresh()
        } catch (error) {
            console.error(
                "PROFILE EDIT ERROR:",
                error
            )

            await Promise.all(
                uploadedPaths.map(
                    removeProfileMedia
                )
            )

            setError(
                error instanceof Error
                    ? error.message
                    : "Не удалось сохранить профиль"
            )
        } finally {
            submitLockRef.current =
                false

            setIsPending(false)
        }
    }

    return {
        displayName,
        setDisplayName,
        username,
        setUsername,
        bio,
        setBio,
        birthDate,
        setBirthDate,
        locationLabel,
        setLocationLabel,
        websiteUrl,
        setWebsiteUrl,
        interests,
        setInterests,
        isPending,
        error,
        setError,
        clearError,
        handleAvatarChange,
        handleCoverChange,
        handleSubmit
    }
}

export default useProfileEditForm