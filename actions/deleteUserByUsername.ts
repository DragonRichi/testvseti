"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Result = {
    success: boolean
    message: string
}

const storageBuckets = ["avatars", "post-media"]

async function getFilesRecursive(bucket: string, folder: string): Promise<string[]> {
    const files: string[] = []
    let offset = 0
    const limit = 100

    while (true) {
        const { data, error } = await supabaseAdmin.storage.from(bucket).list(folder, {
            limit,
            offset,
            sortBy: {
                column: "name",
                order: "asc"
            }
        })

        if (error) {
            throw new Error(`Ошибка чтения ${bucket}: ${error.message}`)
        }

        if (!data || data.length === 0) break

        for (const item of data) {
            const path = `${folder}/${item.name}`

            if (item.id) {
                files.push(path)
            } else {
                const nestedFiles = await getFilesRecursive(bucket, path)
                files.push(...nestedFiles)
            }
        }

        if (data.length < limit) break

        offset += limit
    }

    return files
}

async function deleteUserStorage(userId: string) {
    for (const bucket of storageBuckets) {
        const files = await getFilesRecursive(bucket, userId)

        if (files.length === 0) continue

        for (let index = 0; index < files.length; index += 1000) {
            const batch = files.slice(index, index + 1000)

            const { error } = await supabaseAdmin.storage.from(bucket).remove(batch)

            if (error) {
                throw new Error(`Ошибка удаления из ${bucket}: ${error.message}`)
            }
        }
    }
}

export async function deleteUserByUsername(username: string): Promise<Result> {
    if (process.env.NODE_ENV !== "development") {
        return {
            success: false,
            message: "DEV-удаление отключено"
        }
    }

    const normalizedUsername = username.trim().replace(/^@/, "")

    if (!normalizedUsername) {
        return {
            success: false,
            message: "Введите username"
        }
    }

    const supabase = await createClient()

    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        return {
            success: false,
            message: "Вы не авторизованы"
        }
    }

    const { data: targetProfile, error: profileError } = await supabaseAdmin.from("profiles").select("id,username,display_name").eq("username", normalizedUsername).maybeSingle()

    if (profileError) {
        console.error("DELETE USER PROFILE SEARCH ERROR:", profileError)

        return {
            success: false,
            message: "Ошибка поиска пользователя"
        }
    }

    if (!targetProfile) {
        return {
            success: false,
            message: `Пользователь @${normalizedUsername} не найден`
        }
    }

    if (targetProfile.id === user.id) {
        return {
            success: false,
            message: "Через DEV-кнопку нельзя удалить текущий аккаунт"
        }
    }

    try {
        await deleteUserStorage(targetProfile.id)

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(targetProfile.id)

        if (authError) {
            console.error("DELETE USER AUTH ERROR:", authError)

            return {
                success: false,
                message: `Auth: ${authError.message}`
            }
        }

        console.log("DEV USER DELETE SUCCESS:", targetProfile.username)

        return {
            success: true,
            message: `@${targetProfile.username} удалён`
        }
    } catch (error) {
        console.error("DELETE USER ERROR:", error)

        return {
            success: false,
            message: error instanceof Error ? error.message : "Не удалось удалить пользователя"
        }
    }
}