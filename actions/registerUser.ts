"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Props = {
    displayName: string,
    username: string,
    email: string,
    password: string,
    repeatPassword: string
}

export async function registerUser({ email, displayName, password, repeatPassword, username }: Props) {
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const normalizedDisplayName = displayName.trim()

    const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase()

    const normalizedEmail = email.trim().toLowerCase()

    if (!emailRegex.test(normalizedEmail)) {
        return {
            success: false,
            error: "Введите корректный Email"
        }
    }

    if (!normalizedDisplayName || !normalizedEmail || !normalizedUsername || !password || !repeatPassword) {
        return {
            success: false,
            error: "Заполните все поля"
        }
    }

    if (normalizedDisplayName.length < 2) {
        return {
            success: false,
            error: "Отображаемое имя должно содержать минимум 2 символа"
        }
    }

    if (!usernameRegex.test(normalizedUsername)) {
        return {
            success: false,
            error: "Имя пользователя: 3–20 символов, только латинские буквы, цифры и _"
        }
    }

    if (password.length < 8) {
        return {
            success: false,
            error: "Пароль должен содержать минимум 8 символов"
        }
    }

    if (password !== repeatPassword) {
        return {
            success: false,
            error: "Пароли не совпадают"
        }
    }

    try {

        const { data: existingProfile, error: usernameCheckError } = await supabaseAdmin.from("profiles").select("id").eq("username", normalizedUsername).maybeSingle()

        if (usernameCheckError) {
            console.error("USERNAME CHECK ERROR: ", usernameCheckError)
            return {
                success: false,
                error: "Не удалось проверить имя пользователя"
            }
        }

        if (existingProfile) {
            return {
                success: false,
                error: "Это имя пользователя уже занято"
            }
        }

        const supabase = await createClient()

        const { data, error: authError } = await supabase.auth.signUp({
            email: normalizedEmail,
            password,
            options: {
                data: {
                    display_name: normalizedDisplayName,
                    username: normalizedUsername
                }
            }
        })

        if (authError) {
            if (authError.message === "User already registered") {
                return {
                    success: false,
                    error:"Данный Email уже зарегистрирован"
                }
            }

            console.error("SIGNUP ERROR: ", authError)
            return {
                success: false,
                error: authError.message
            }
        }

        if (!data.user) {
            return {
                success: false,
                error: "Не удалось создать аккаунт"
            }
        }

        const { error: profileError } = await supabaseAdmin.from("profiles").insert({
            id: data.user.id,
            username: normalizedUsername,
            display_name: normalizedDisplayName,
            monthly_views: 0
        })

        if (profileError) {
            console.error("PROFILE CREATE ERROR: ", profileError)

            const isUsernameToken = profileError.code === "23505"

            const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(data.user.id)

            if (deleteError) {
                console.error("AUTH CLEANUP ERROR: ", deleteError)
            }

            if (isUsernameToken) {
                return {
                    success: false,
                    error: "Это имя уже занято"
                }
            }
            return {
                success: false,
                error: "Не удалось создать профиль"
            }
        }

        return {
            success: true,
            error: null,
            user: {
                id: data.user.id,
                email: data.user.email,
                username: normalizedUsername,
                displayName: normalizedDisplayName
            },
            needsEmailConfirmation: data.session === null
        }
    } catch (error) {
        console.error("REGISTER ERROR: ", error)
        return {
            success: false,
            error: "Ошибка создания аккаунта"
        }
    }

}