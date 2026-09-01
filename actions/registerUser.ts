"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type Props = {
    displayName: string
    username: string
    email: string
    password: string
    repeatPassword: string
}

export async function registerUser({ displayName, username, email, password, repeatPassword }: Props) {
    const usernameRegex = /^[a-z0-9_]{3,20}$/
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const normalizedDisplayName = displayName.trim()
    const normalizedUsername = username.trim().replace(/^@+/, "").toLowerCase()
    const normalizedEmail = email.trim().toLowerCase()

    if (!normalizedDisplayName || !normalizedUsername || !normalizedEmail || !password || !repeatPassword) {
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

    if (normalizedDisplayName.length > 20) {
        return {
            success: false,
            error: "Отображаемое имя не должно превышать 20 символов"
        }
    }

    if (!usernameRegex.test(normalizedUsername)) {
        return {
            success: false,
            error: "Имя пользователя: 3–20 символов, только латинские буквы, цифры и _"
        }
    }

    if (!emailRegex.test(normalizedEmail)) {
        return {
            success: false,
            error: "Введите корректный Email"
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
        const { data: existingUsername, error: usernameCheckError } = await supabaseAdmin.from("profiles").select("id").eq("username", normalizedUsername).maybeSingle()

        if (usernameCheckError) {
            console.error("USERNAME CHECK ERROR:", usernameCheckError)

            return {
                success: false,
                error: "Не удалось проверить имя пользователя"
            }
        }

        if (existingUsername) {
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
            console.error("SIGNUP ERROR:", authError)

            const authMessage = authError.message.toLowerCase()

            if (authMessage.includes("already registered") || authMessage.includes("already exists") || authMessage.includes("user already registered")) {
                return {
                    success: false,
                    error: "Аккаунт с таким Email уже существует"
                }
            }

            const { data: usernameAfterError } = await supabaseAdmin.from("profiles").select("id").eq("username", normalizedUsername).maybeSingle()

            if (usernameAfterError) {
                return {
                    success: false,
                    error: "Это имя пользователя уже занято"
                }
            }

            return {
                success: false,
                error: authError.message || "Ошибка регистрации"
            }
        }

        if (!data.user) {
            return {
                success: false,
                error: "Не удалось создать аккаунт"
            }
        }

        console.log("REGISTER SUCCESS:", data.user.id)

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
        console.error("REGISTER ERROR:", error)

        return {
            success: false,
            error: "Ошибка создания аккаунта"
        }
    }
}