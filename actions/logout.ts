"use server"

import { createClient } from "@/lib/supabase/server"

type Result =
    | {
        success: true
        error: null
    }
    | {
        success: false
        error: string
    }

export async function logout(): Promise<Result> {
    const supabase = await createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
        console.error("LOGOUT ERROR:", error)

        return {
            success: false,
            error: "Не удалось выйти из аккаунта"
        }
    }

    return {
        success: true,
        error: null
    }
}