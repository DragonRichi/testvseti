import GeoChatRoom from "@/components/GeoChat/GeoChatRoom"
import SocialLayout from "@/components/Layout/SocialLayout"
import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import { MapPin } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

type Props = {
    params: Promise<{
        id: string
    }>
}

type RoomRow = {
    id: string
    creator_id: string
    name: string
    description: string | null
    radius_m: number
    distance_m: number
    created_at: string
}

type MessageRow = {
    id: string
    chat_id: string
    user_id: string
    content: string
    created_at: string
    updated_at: string
    author_username: string
    author_display_name: string | null
    author_avatar_url: string | null
}

async function Page({ params }: Props) {
    const { id } = await params

    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const { data: currentProfile, error: profileError } = await supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single()

    if (profileError || !currentProfile) {
        console.error("GEO CHAT PROFILE ERROR:", profileError)
        redirect("/")
    }

    const { data: roomData, error: roomError } = await supabase.rpc("get_geo_chat_room", {
        p_chat_id: id
    })

    if (roomError) {
        console.error("GEO CHAT ROOM LOAD ERROR:", roomError)
    }

    const roomRow = ((roomData ?? []) as RoomRow[])[0] ?? null

    if (!roomRow) {
        return (
            <SocialLayout profile={currentProfile}>
                <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 text-center">
                    <div className="max-w-[420]">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <MapPin className="size-6" />
                        </div>

                        <h1 className="mt-4 text-lg font-bold text-gray-900">Геочат сейчас недоступен</h1>

                        <p className="mt-2 text-sm leading-6 text-main-gray">Вы находитесь вне зоны этого геочата или геочат больше не существует.</p>

                        <Link href="/geochats" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                            Вернуться к геочатам
                        </Link>
                    </div>
                </div>
            </SocialLayout>
        )
    }

    const { data: messagesData, error: messagesError } = await supabase.rpc("get_geo_chat_messages", {
        p_chat_id: id,
        p_limit: 100
    })

    if (messagesError) {
        console.error("GEO CHAT MESSAGES LOAD ERROR:", messagesError)
    }

    const room: GeoChatRoomType = {
        id: roomRow.id,
        creatorId: roomRow.creator_id,
        name: roomRow.name,
        description: roomRow.description,
        radiusM: roomRow.radius_m,
        distanceM: roomRow.distance_m,
        createdAt: roomRow.created_at
    }

    const initialMessages: GeoChatMessage[] = ((messagesData ?? []) as MessageRow[]).map((message) => ({
        id: message.id,
        chatId: message.chat_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
        authorUsername: message.author_username,
        authorDisplayName: message.author_display_name ?? message.author_username,
        authorAvatarUrl: message.author_avatar_url
    }))

    return (
        <SocialLayout profile={currentProfile}>
            <GeoChatRoom room={room} initialMessages={initialMessages} currentProfile={currentProfile} />
        </SocialLayout>
    )
}

export default Page