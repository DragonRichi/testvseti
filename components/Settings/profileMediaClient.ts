import type {
    ProfileMediaKind,
    UploadedProfileMedia
} from "./profileEditTypes"

export async function uploadProfileMedia(
    kind: ProfileMediaKind,
    file: File
): Promise<UploadedProfileMedia> {
    const formData =
        new FormData()

    formData.set(
        "kind",
        kind
    )

    formData.set(
        "file",
        file
    )

    const response =
        await fetch(
            "/api/profile-media",
            {
                method: "POST",
                body: formData
            }
        )

    const result =
        await response.json()

    if (!response.ok) {
        throw new Error(
            result.error ||
                "Не удалось загрузить изображение"
        )
    }

    return result
}

export async function removeProfileMedia(
    path: string
) {
    const response =
        await fetch(
            "/api/profile-media",
            {
                method: "DELETE",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body:
                    JSON.stringify({
                        path
                    })
            }
        )

    if (!response.ok) {
        console.error(
            "PROFILE MEDIA REMOVE FAILED:",
            path
        )
    }
}