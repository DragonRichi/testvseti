"use server"

import { createClient } from "@/lib/supabase/server"

type Props = {
    email: string,
    password: string
}

export async function loginUser({ email, password }: Props) {

    if (!email || !password) {
        return {
            success: false,
            error: "Введите email и пароль"
        }
    }

    try {
        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password
        })

        if (error) {
            if (error.message === "Email not confirmed") {
                return {
                    success: false,
                    error: "Сначала подтвердите Email"
                }
            } else if (error.message === "Invalid login credentials") {
                return {
                    success: false,
                    error: "Неверные учётные данные"
                }
            }
            return {
                success: false,
                error: error.message || "Ошибка авторизации"
            }
        }

        return {
            success: true,
            error: null,
            user: {
                id: data.user.id,
                email: data.user.email
            }
        }

    } catch (error) {
        console.error("LOGIN FAILED: ", error)

        return {
            success: false,
            error: "Ошибка авторизации"
        }
    }
}