"use server"

import { createClient } from "@/lib/supabase/server"
import { isUuid } from "@/lib/validation/uuid"

type Result =
    | {
        success: true
        enabled: boolean
    }
    | {
        success: false
        error: string
    }

export async function getProfileNotificationSubscription(
    profileId: string
): Promise<Result> {
    if (!isUuid(profileId)) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    const supabase =
        await createClient()

    const {
        data: { user },
        error: userError
    } =
        await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Необходимо войти в аккаунт"
        }
    }

    if (user.id === profileId) {
        return {
            success: true,
            enabled: false
        }
    }

    const {
        data,
        error
    } = await supabase
        .from(
            "profile_notification_subscriptions"
        )
        .select("profile_id")
        .eq(
            "subscriber_id",
            user.id
        )
        .eq(
            "profile_id",
            profileId
        )
        .maybeSingle()

    if (error) {
        console.error(
            "PROFILE NOTIFICATION STATE ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось проверить уведомления"
        }
    }

    return {
        success: true,
        enabled: Boolean(data)
    }
}