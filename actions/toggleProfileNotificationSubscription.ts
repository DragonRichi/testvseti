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

export async function toggleProfileNotificationSubscription(
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
            success: false,
            error: "Нельзя подписаться на собственные уведомления"
        }
    }

    const {
        data: profile,
        error: profileError
    } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", profileId)
        .maybeSingle()

    if (
        profileError ||
        !profile
    ) {
        return {
            success: false,
            error: "Профиль не найден"
        }
    }

    const {
        data: existing,
        error: stateError
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

    if (stateError) {
        console.error(
            "PROFILE NOTIFICATION STATE ERROR:",
            stateError
        )

        return {
            success: false,
            error: "Не удалось изменить уведомления"
        }
    }

    if (existing) {
        const { error } =
            await supabase
                .from(
                    "profile_notification_subscriptions"
                )
                .delete()
                .eq(
                    "subscriber_id",
                    user.id
                )
                .eq(
                    "profile_id",
                    profileId
                )

        if (error) {
            console.error(
                "PROFILE NOTIFICATION DELETE ERROR:",
                error
            )

            return {
                success: false,
                error: "Не удалось отключить уведомления"
            }
        }

        return {
            success: true,
            enabled: false
        }
    }

    const { error } =
        await supabase
            .from(
                "profile_notification_subscriptions"
            )
            .insert({
                subscriber_id:
                    user.id,
                profile_id:
                    profileId
            })

    if (error) {
        console.error(
            "PROFILE NOTIFICATION INSERT ERROR:",
            error
        )

        return {
            success: false,
            error: "Не удалось включить уведомления"
        }
    }

    return {
        success: true,
        enabled: true
    }
}