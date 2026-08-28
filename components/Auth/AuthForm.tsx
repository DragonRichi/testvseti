"use client"

import { loginUser } from "@/actions/loginUser"
import { registerUser } from "@/actions/registerUser"
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"

function AuthForm() {
    const [showPassword, setShowPassword] = useState(true)
    const [showRepeatPassword, setShowRepeatPassword] = useState(true)
    const [isLogin, setIsLogin] = useState(true)
    const [isPending, setIsPending] = useState(false)
    const [error, setError] = useState("")

    const submitLock = useRef(false)

    const router = useRouter()

    const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()

        const formData = new FormData(e.currentTarget)

        const email = String(formData.get("email") ?? "").trim()
        const password = String(formData.get("password") ?? "")

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        if (isLogin) {
            if (!email || !password) {
                setError("Заполните все поля")
                return
            }

            if (!emailRegex.test(email)) {
                setError("Введите корректный Email")
                return
            }

            if (submitLock.current) return

            submitLock.current = true
            setIsPending(true)

            try {
                const { success, error: loginError, user } = await loginUser({ email, password })

                if (!success) {
                    setError(loginError || "Ошибка входа в аккаунт")
                    return
                }

                console.log("LOGIN SUCCESS:", user)

                router.push("/feed")
                router.refresh()
            } catch (error) {
                console.error("LOGIN ERROR:", error)
                setError("Не удалось выполнить вход")
            } finally {
                submitLock.current = false
                setIsPending(false)
            }

            return
        }

        const displayName = String(formData.get("displayName") ?? "").trim()
        const username = String(formData.get("username") ?? "").trim().replace(/^@+/, "").toLowerCase()
        const repeatPassword = String(formData.get("repeatPassword") ?? "")

        const usernameRegex = /^[a-z0-9_]{3,20}$/

        if (!displayName || !username || !email || !password || !repeatPassword) {
            setError("Заполните все поля")
            return
        }

        if (displayName.length < 2) {
            setError("Отображаемое имя должно содержать минимум 2 символа")
            return
        }

        if (displayName.length > 20) {
            setError("Отображаемое имя не должно превышать 20 символов")
            return
        }

        if (!usernameRegex.test(username)) {
            setError("Имя пользователя: от 3 до 20 символов, только латинские буквы, цифры и _")
            return
        }

        if (!emailRegex.test(email)) {
            setError("Введите корректный Email")
            return
        }

        if (password.length < 8) {
            setError("Пароль должен содержать минимум 8 символов")
            return
        }

        if (password !== repeatPassword) {
            setError("Пароли не совпадают")
            return
        }

        if (submitLock.current) return

        submitLock.current = true
        setIsPending(true)

        try {
            const { error: signUpError, success, user, needsEmailConfirmation } = await registerUser({ email, displayName, password, repeatPassword, username })

            if (!success) {
                setError(signUpError || "Ошибка регистрации аккаунта")
                return
            }

            console.log("REGISTER SUCCESS:", user)
            console.log("NEEDS EMAIL CONFIRMATION:", needsEmailConfirmation)

            if (needsEmailConfirmation) {
                setError("Аккаунт создан. Подтвердите Email, после чего войдите в аккаунт.")
                return
            }

            setError("")
            router.replace("/feed")
            router.refresh()

        } catch (error) {
            console.error("REGISTER ERROR:", error)
            setError("Не удалось выполнить регистрацию")
        } finally {
            submitLock.current = false
            setIsPending(false)
        }
    }

    const handleClearInput = () => {
        setError("")
    }

    const handleChangeMode = () => {
        if (isPending) return

        setIsLogin((prev) => !prev)
        setError("")
        setShowPassword(true)
        setShowRepeatPassword(true)
    }

    return (
        <div className="w-full">
            <div className="pr-10 text-2xl font-bold">
                {isLogin ? "Вход в аккаунт" : "Создание аккаунта"}
            </div>

            <div className="mt-1 pr-8 text-sm text-main-gray">
                {isLogin ? "Введите данные своей учётной записи" : "Создайте аккаунт в ВСети"}
            </div>

            <form key={isLogin ? "login" : "register"} onSubmit={handleSubmit} className="mt-6 flex w-full flex-col gap-4" noValidate>
                {!isLogin && (
                    <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                        <label className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-black/8 bg-[#fafcfb] px-3 py-2.5 transition-all duration-200 hover:border-main-green/40 hover:bg-white focus-within:border-main-green/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-main-green/8 sm:flex-1">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green text-main-green transition-transform duration-200 group-focus-within:scale-105">
                                <UserRound className="size-5" />
                            </div>

                            <input placeholder="Отображаемое имя" name="displayName" type="text" className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-400" onChange={handleClearInput} autoComplete="name" maxLength={20} />
                        </label>

                        <label className="group flex w-full min-w-0 items-center gap-3 rounded-2xl border border-black/8 bg-[#fafcfb] px-3 py-2.5 transition-all duration-200 hover:border-main-green/40 hover:bg-white focus-within:border-main-green/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-main-green/8 sm:flex-1">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green text-main-green transition-transform duration-200 group-focus-within:scale-105">
                                <UserRound className="size-5" />
                            </div>

                            <span className="shrink-0 text-main-gray">@</span>

                            <input placeholder="username" name="username" type="text" className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-400" onChange={handleClearInput} autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={20} />
                        </label>
                    </div>
                )}

                <label className="group flex w-full items-center gap-3 rounded-2xl border border-black/8 bg-[#fafcfb] px-3 py-2.5 transition-all duration-200 hover:border-main-green/40 hover:bg-white focus-within:border-main-green/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-main-green/8">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green text-main-green transition-transform duration-200 group-focus-within:scale-105">
                        <Mail className="size-5" />
                    </div>

                    <input placeholder="Email" name="email" type="email" className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-400" onChange={handleClearInput} autoComplete="email" />
                </label>

                <label className="group flex w-full items-center gap-3 rounded-2xl border border-black/8 bg-[#fafcfb] px-3 py-2.5 transition-all duration-200 hover:border-main-green/40 hover:bg-white focus-within:border-main-green/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-main-green/8">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green text-main-green transition-transform duration-200 group-focus-within:scale-105">
                        <LockKeyhole className="size-5" />
                    </div>

                    <input type={showPassword ? "password" : "text"} className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-400" placeholder="Пароль" name="password" onChange={handleClearInput} autoComplete={isLogin ? "current-password" : "new-password"} />

                    <button type="button" aria-label={showPassword ? "Показать пароль" : "Скрыть пароль"} onClick={() => setShowPassword((prev) => !prev)} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-main-gray transition-all duration-200 hover:bg-bg-green hover:text-main-green">
                        <Eye className="size-5" />
                    </button>
                </label>

                {!isLogin && (
                    <label className="group flex w-full items-center gap-3 rounded-2xl border border-black/8 bg-[#fafcfb] px-3 py-2.5 transition-all duration-200 hover:border-main-green/40 hover:bg-white focus-within:border-main-green/60 focus-within:bg-white focus-within:ring-4 focus-within:ring-main-green/8">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green text-main-green transition-transform duration-200 group-focus-within:scale-105">
                            <LockKeyhole className="size-5" />
                        </div>

                        <input type={showRepeatPassword ? "password" : "text"} className="min-w-0 flex-1 bg-transparent text-base text-black outline-none placeholder:text-gray-400" placeholder="Повторите пароль" name="repeatPassword" onChange={handleClearInput} autoComplete="new-password" />

                        <button type="button" aria-label={showRepeatPassword ? "Показать пароль" : "Скрыть пароль"} onClick={() => setShowRepeatPassword((prev) => !prev)} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-main-gray transition-all duration-200 hover:bg-bg-green hover:text-main-green">
                            <Eye className="size-5" />
                        </button>
                    </label>
                )}

                {isLogin && (
                    <button type="button" className="cursor-pointer self-end text-sm text-text-green transition-colors hover:text-hover-green">
                        Забыли пароль?
                    </button>
                )}

                {error && (
                    <div className="w-full wrap-break-words rounded-xl border border-red-200 bg-red-500 px-4 py-3 text-sm text-white">
                        {error}
                    </div>
                )}

                <button type="submit" disabled={isPending} className="flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl bg-main-green text-base font-medium text-white shadow-sm shadow-main-green/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-hover-green hover:shadow-md hover:shadow-main-green/25 active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50">
                    {isPending ? "Подождите..." : isLogin ? "Войти" : "Регистрация"}
                </button>

                <div className="text-center text-sm">
                    {isLogin ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}

                    <button type="button" className="cursor-pointer text-text-green transition-colors hover:text-hover-green" onClick={handleChangeMode}>
                        &nbsp;{isLogin ? "Зарегистрируйтесь" : "Войти"}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AuthForm