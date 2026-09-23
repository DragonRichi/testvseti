import GeoChatRoom from "@/components/GeoChat/GeoChatRoom"
import getCurrentViewer from "@/lib/auth/getCurrentViewer"
import { hasGeoChatAdminMode } from "@/lib/geochats/geoChatAdminMode"
import { loadGeoChatMessages } from "@/lib/geochats/loadGeoChatMessages"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { GeoChatMessage, GeoChatRoom as GeoChatRoomType } from "@/types/geoChat"
import type { GeoChatMessageAttachmentMap } from "@/types/geoChatAttachments"
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

type InitialMessagesData = {
    messages: GeoChatMessage[]
    initialAttachments: GeoChatMessageAttachmentMap
    hasMore: boolean
}

const emptyMessagesData: InitialMessagesData = {
    messages: [],
    initialAttachments: {},
    hasMore: false
}

async function Page({ params }: Props) {
    const { id } = await params

    const [viewer, adminMode, initialData] = await Promise.all([
        getCurrentViewer(),
        hasGeoChatAdminMode(),
        loadGeoChatMessages(id).catch((error) => {
            console.error("GEO CHAT INITIAL MESSAGES LOAD ERROR:", error)
            return emptyMessagesData
        })
    ])

    if (!viewer) {
        redirect("/")
    }

    const roomPromise: Promise<RoomRow | null> = adminMode
        ? supabaseAdmin
            .from("geo_chats")
            .select("id,creator_id,name,description,radius_m,created_at")
            .eq("id", id)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error("ADMIN GEO CHAT ROOM LOAD ERROR:", error)
                }

                if (!data) {
                    return null
                }

                return {
                    id: data.id,
                    creator_id: data.creator_id,
                    name: data.name,
                    description: data.description,
                    radius_m: data.radius_m,
                    distance_m: null,
                    created_at: data.created_at
                }
            })
        : createClient().then((supabase) =>
            supabase
                .rpc("get_geo_chat_room", { p_chat_id: id })
                .then(({ data, error }) => {
                    if (error) {
                        console.error("GEO CHAT ROOM LOAD ERROR:", error)
                    }

                    return ((data ?? []) as RoomRow[])[0] ?? null
                })
        )

    const roomRow = await roomPromise

    if (!roomRow) {
        return (
            <div className="flex min-h-[420] items-center justify-center rounded-2xl border border-amber-100 bg-white px-5 text-center">
                <div className="max-w-[420]">
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                        <MapPin className="size-6" />
                    </div>

                    <h1 className="mt-4 text-lg font-bold text-gray-900">
                        Геочат сейчас недоступен
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-main-gray">
                        {adminMode
                            ? "Геочат больше не существует."
                            : "Вы находитесь вне зоны этого геочата или геочат больше не существует."}
                    </p>

                    <Link href="/geochats" prefetch={true} className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-main-green px-4 text-sm font-medium text-white transition-colors hover:bg-hover-green">
                        Вернуться к геочатам
                    </Link>
                </div>
            </div>
        )
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

    return (
        <GeoChatRoom
            room={room}
            initialMessages={initialData.messages}
            initialAttachments={initialData.initialAttachments}
            initialHasMore={initialData.hasMore}
            currentProfile={viewer.profile}
            initialAdminMode={adminMode}
        />
    )
}

export default Page
