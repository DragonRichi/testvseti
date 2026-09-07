import GeoChatRoom from "@/components/GeoChat/GeoChatRoom"
import SocialLayout from "@/components/Layout/SocialLayout"
import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType, GeoChatSenderRole } from "@/types/geoChat"
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
    distance_m: number | null
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
    reply_to_id: string | null
    reply_author_username: string | null
    reply_author_display_name: string | null
    reply_content: string | null
}

function normalizeSenderRole(value: string | null): GeoChatSenderRole | null {
    if (value === "admin") return "admin"
    if (value === "moderator") return "moderator"

    return null
}

async function Page({ params }: Props) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) redirect("/")

    const [{ data: currentProfile, error: profileError }, adminMode] = await Promise.all([
        supabase.from("profiles").select("id,username,display_name,avatar_url").eq("id", user.id).single(),
        hasGeoChatAdminMode()
    ])

    if (profileError || !currentProfile) {
        console.error("GEO CHAT PROFILE ERROR:", profileError)
        redirect("/")
    }

    let roomRow: RoomRow | null = null

    if (adminMode) {
        const { data: adminRoom, error: adminRoomError } = await supabaseAdmin.from("geo_chats").select("id,creator_id,name,description,radius_m,created_at").eq("id", id).maybeSingle()

        if (adminRoomError) {
            console.error("ADMIN GEO CHAT ROOM LOAD ERROR:", adminRoomError)
        }

        if (adminRoom) {
            roomRow = {
                id: adminRoom.id,
                creator_id: adminRoom.creator_id,
                name: adminRoom.name,
                description: adminRoom.description,
                radius_m: adminRoom.radius_m,
                distance_m: null,
                created_at: adminRoom.created_at
            }
        }
    } else {
        const { data: roomData, error: roomError } = await supabase.rpc("get_geo_chat_room", {
            p_chat_id: id
        })

        if (roomError) {
            console.error("GEO CHAT ROOM LOAD ERROR:", roomError)
        }

        roomRow = ((roomData ?? []) as RoomRow[])[0] ?? null
    }

    if (!roomRow) {
        return (
            <SocialLayout profile={currentProfile}>
                <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 text-center">
                    <div className="max-w-[420]">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <MapPin className="size-6" />
                        </div>

                        <h1 className="mt-4 text-lg font-bold text-gray-900">Геочат сейчас недоступен</h1>

                        <p className="mt-2 text-sm leading-6 text-main-gray">{adminMode ? "Геочат больше не существует." : "Вы находитесь вне зоны этого геочата или геочат больше не существует."}</p>

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

    const messageRows = (messagesData ?? []) as MessageRow[]
    const messageIds = messageRows.map((message) => message.id)

    const senderRolesById = new Map<string, GeoChatSenderRole | null>()

    if (messageIds.length > 0) {
        const { data: roleRows, error: rolesError } = await supabaseAdmin.from("geo_chat_messages").select("id,sender_role").in("id", messageIds)

        if (rolesError) {
            console.error("GEO CHAT MESSAGE ROLES LOAD ERROR:", rolesError)
        }

        for (const row of roleRows ?? []) {
            senderRolesById.set(row.id, normalizeSenderRole(row.sender_role))
        }
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

    const initialMessages: GeoChatMessage[] = messageRows.map((message) => ({
        id: message.id,
        chatId: message.chat_id,
        userId: message.user_id,
        content: message.content,
        createdAt: message.created_at,
        updatedAt: message.updated_at,
        authorUsername: message.author_username,
        authorDisplayName: message.author_display_name ?? message.author_username,
        authorAvatarUrl: message.author_avatar_url,
        replyTo: message.reply_to_id && message.reply_author_username && message.reply_content ? {
            id: message.reply_to_id,
            authorUsername: message.reply_author_username,
            authorDisplayName: message.reply_author_display_name ?? message.reply_author_username,
            content: message.reply_content
        } : null,
        senderRole: senderRolesById.get(message.id) ?? null
    }))

    return (
        <SocialLayout profile={currentProfile}>
            <GeoChatRoom room={room} initialMessages={initialMessages} currentProfile={currentProfile} initialAdminMode={adminMode} />
        </SocialLayout>
    )
}

export default Page