"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

type DeleteAccountResult =
    | {
        success: false
        error: string
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
            throw new Error(`Не удалось прочитать Storage ${bucket}: ${error.message}`)
        }

        if (!data || data.length === 0) break

        for (const item of data) {
            const path = folder ? `${folder}/${item.name}` : item.name

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

async function deleteStorageForUser(userId: string) {
    for (const bucket of storageBuckets) {
        const files = await getFilesRecursive(bucket, userId)

        if (files.length === 0) continue

        for (let index = 0; index < files.length; index += 1000) {
            const batch = files.slice(index, index + 1000)

            const { error } = await supabaseAdmin.storage.from(bucket).remove(batch)

            if (error) {
                throw new Error(`Не удалось удалить файлы из ${bucket}: ${error.message}`)
            }
        }
    }
}

export async function deleteAccount(): Promise<DeleteAccountResult | never> {
    const supabase = await createClient()

    const {
        data: { user },
        error: userError
    } = await supabase.auth.getUser()

    if (userError || !user) {
        return {
            success: false,
            error: "Пользователь не авторизован"
        }
    }

    try {
        await deleteStorageForUser(user.id)

        const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (deleteUserError) {
            console.error("DELETE ACCOUNT AUTH ERROR:", deleteUserError)

            return {
                success: false,
                error: "Не удалось удалить аккаунт"
            }
        }
    } catch (error) {
        console.error("DELETE ACCOUNT ERROR:", error)

        return {
            success: false,
            error: error instanceof Error ? error.message : "Не удалось удалить аккаунт"
        }
    }

    await supabase.auth.signOut()

    redirect("/")
}