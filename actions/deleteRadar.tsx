"use server"

import { getCurrentUser } from "@/lib/auth/getCurrentUser"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

type Result =
    | {
        success: true
        error: null
    }
    | {
        success: false
        error: string
    }

export async function deleteRadar(radarId: string): Promise<Result> {
    const user = await getCurrentUser()

    if (!user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    const supabase = await createClient()

    const { data: radar, error: radarError } = await supabase.from("radars").select("id,user_id,name").eq("id", radarId).eq("user_id", user.id).maybeSingle()

    if (radarError) {
        console.error("RADAR DELETE LOAD ERROR:", radarError)

        return {
            success: false,
            error: "Не удалось проверить радар"
        }
    }

    if (!radar) {
        return {
            success: false,
            error: "Радар не найден"
        }
    }

    const { error: deleteError } = await supabase.from("radars").delete().eq("id", radar.id).eq("user_id", user.id)

    if (deleteError) {
        console.error("RADAR DELETE ERROR:", deleteError)

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