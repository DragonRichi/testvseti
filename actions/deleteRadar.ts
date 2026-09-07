"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type RpcRow = {
    status: "ok" | "unauthorized" | "radar_not_found"
    radar_id: string | null
}

type Result =
    | {
        success: true
        error: null
    }
    | {
        success: false
        error: string
    }

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function deleteRadar(radarId: string): Promise<Result> {
    if (typeof radarId !== "string" || !uuidPattern.test(radarId)) {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("delete_user_radar", {
        p_radar_id: radarId
    })

    if (error) {
        console.error("RADAR DELETE RPC ERROR:", error)

        return {
            success: false,
            error: "Не удалось удалить радар"
        }
    }

    const row = ((data ?? []) as RpcRow[])[0]

    if (!row) {
        return {
            success: false,
            error: "Не удалось удалить радар"
        }
    }

    if (row.status === "unauthorized") {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (row.status === "radar_not_found") {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

    if (!row.radar_id) {
        console.error("RADAR DELETE RPC INVALID RESPONSE:", row)

        return {
            success: false,
            error: "Не удалось удалить радар"
        }
    }

    revalidatePath("/feed")
    revalidatePath("/radars/new")

    return {
        success: true,
        error: null
    }
}