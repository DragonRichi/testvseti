"use server"

import { createClient } from "@/lib/supabase/server"

type Props = {
    name: string,
    surname: string,
    email: string,
    password: string,
    repeatPassword: string
}

export async function registerUser({ email, name, password, repeatPassword, surname }: Props) {

    if (!name || !email || !surname || !password || !repeatPassword) {
        return {
            success: false,
            error: "Заполните все поля"
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
        const supabase = await createClient()

        const { data, error: AuthError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    first_name: name,
                    last_name: surname,
                    display_name: `${name} ${surname}`
                }
            }
        })

        if (AuthError) {
            return {
                success: false,
                error: AuthError.message || "Ошибка регистрации."
            }
        }

        console.log("SUCCESS SIGNUP: ", data)
        return {
            success: true,
            error: null,
            user: data.user
        }
    } catch (error) {
        console.error("REGISTER ERROR: ", error)
        return {
            success: false,
            error: "Ошибка создания аккаунта"
        }
    }

}