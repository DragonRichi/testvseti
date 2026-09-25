export type EditableProfile = {
    id: string
    username: string
    display_name: string
    avatar_url: string | null
    cover_url: string | null
    bio: string | null
    birth_date: string | null
    location_label: string | null
    website_url: string | null
    interests: string[] | null
}

export type UploadedProfileMedia = {
    url: string
    path: string
}

export type ProfileMediaKind =
    | "avatar"
    | "cover"