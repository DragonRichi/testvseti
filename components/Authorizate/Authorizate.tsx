"use client"
import { loginUser } from "@/actions/loginUser"
import { registerUser } from "@/actions/registerUser"
import { Eye, LockKeyhole, Mail, UserRound } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"


function Authorizate() {
    const [showPassword, setShowPassword] = useState<boolean>(true)
    const [showRepeatPassword, setShowRepeatPassword] = useState<boolean>(true)
    const [isLogin, setIsLogin] = useState<boolean>(true)
    const [isPending, setIsPending] = useState<boolean>(false)
    const [error, setError] = useState<string>("")

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

            setIsPending(true)


            try {
                const { success, error: loginError, user } = await loginUser({ email: email, password: password })

                if (!success) {
                    setError(loginError || "Ошибка входа в аккаунт")
                    return
                }

                console.log("LOGIN SUCCESS: ", user)
                router.push("/feed")
                router.refresh()

            } catch (error) {
                console.error(error)
                setError("Не удалось выполнить вход")
            } finally {
                setIsPending(false)
            }
            return
        } else {
            const name = String(formData.get("name") ?? "").trim()
            const surname = String(formData.get("surname") ?? "").trim()
            const repeatPassword = String(formData.get("repeatPassword") ?? "")

            if (name.trim().length < 2) {
                setError("Имя должно содержать минимум 2 символа")
                return
            }
            if (surname.trim().length < 3) {
                setError("Фамилия должна содержать минимум 3 символа")
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

            if (!emailRegex.test(email)) {
                setError("Введите корректный Email")
                return
            }

            setIsPending(true)
            try {
                const { error: signUpError, success, user } = await registerUser({
                    email: email,
                    name: name,
                    password: password,
                    repeatPassword: repeatPassword,
                    surname: surname
                })

                if (!success) {
                    setError(signUpError || "Ошибка регистрации аккаунта")
                    return
                }

                router.push("/feed")
                router.refresh()
                console.log(user)


            } catch (error) {
                setError("Не удалось выполнить регистрацию")
            } finally {
                setIsPending(false)
            }
            return
        }
    }

    const handleClearInput = () => {
        setError("")
    }

    return (
        <div className="min-h-dvh bg-white px-4 py-6 sm:bg-[#f7f8f7] sm:px-6 sm:py-10">
            <div className="mx-auto flex min-h-[calc(100dvh-48px)] w-full max-w-[560] flex-col items-center">

                <Link
                    href="/"
                    className="text-4xl font-bold tracking-tight sm:text-5xl"
                >
                    vseti
                    <span className="text-main-green">.by</span>
                </Link>

                <div className="mt-2 text-center text-sm text-main-gray sm:text-base">
                    Социальная сеть для своих
                </div>

                <div className="mt-8 text-center text-2xl font-bold sm:text-3xl">
                    {isLogin
                        ? "Вход в аккаунт"
                        : "Создание аккаунта"}
                </div>

                <div className="mt-2 max-w-[420] text-center text-sm leading-6 text-main-gray sm:text-base">
                    {isLogin
                        ? "Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт"
                        : "Присоединяйтесь к vseti.by и общайтесь с друзьями и близкими"}
                </div>

                <form
                    key={isLogin ? "login" : "register"}
                    onSubmit={handleSubmit}
                    className="mt-8 flex w-full flex-col gap-4"
                    noValidate
                >
                    {!isLogin && (
                        <div className="flex flex-col gap-4 sm:flex-row sm:gap-3">
                            <label className="
                            flex w-full min-w-0 items-center gap-3
                            rounded-xl border border-border-gray
                            px-3 py-2.5
                            transition-colors
                            focus-within:border-main-green
                            sm:flex-1
                        ">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green">
                                    <UserRound className="size-5 text-main-green" />
                                </div>

                                <input
                                    placeholder="Имя"
                                    name="name"
                                    type="text"
                                    className="min-w-0 flex-1 bg-transparent text-base outline-none"
                                    onChange={handleClearInput}
                                    autoComplete="given-name"
                                />
                            </label>

                            <label className="
                            flex w-full min-w-0 items-center gap-3
                            rounded-xl border border-border-gray
                            px-3 py-2.5
                            transition-colors
                            focus-within:border-main-green
                            sm:flex-1
                        ">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green">
                                    <UserRound className="size-5 text-main-green" />
                                </div>

                                <input
                                    placeholder="Фамилия"
                                    name="surname"
                                    type="text"
                                    className="min-w-0 flex-1 bg-transparent text-base outline-none"
                                    onChange={handleClearInput}
                                    autoComplete="family-name"
                                />
                            </label>
                        </div>
                    )}

                    <label className="
                    flex w-full items-center gap-3
                    rounded-xl border border-border-gray
                    px-3 py-2.5
                    transition-colors
                    focus-within:border-main-green
                ">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green">
                            <Mail className="size-5 text-main-green" />
                        </div>

                        <input
                            placeholder="Email"
                            name="email"
                            type="email"
                            className="min-w-0 flex-1 bg-transparent text-base outline-none"
                            onChange={handleClearInput}
                            autoComplete="email"
                        />
                    </label>

                    <label className="
                    flex w-full items-center gap-3
                    rounded-xl border border-border-gray
                    px-3 py-2.5
                    transition-colors
                    focus-within:border-main-green
                ">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green">
                            <LockKeyhole className="size-5 text-main-green" />
                        </div>

                        <input
                            type={showPassword ? "password" : "text"}
                            className="min-w-0 flex-1 bg-transparent text-base outline-none"
                            placeholder="Пароль"
                            name="password"
                            onChange={handleClearInput}
                            autoComplete={isLogin ? "current-password" : "new-password"}
                        />

                        <button
                            type="button"
                            aria-label={showPassword ? "Показать пароль" : "Скрыть пароль"}
                            className="shrink-0 rounded-lg p-2 text-main-gray transition-colors hover:text-black cursor-pointer"
                            onClick={() => setShowPassword((prev) => !prev)}
                        >
                            <Eye className="size-5" />
                        </button>
                    </label>

                    {!isLogin && (
                        <label className="
                        flex w-full items-center gap-3
                        rounded-xl border border-border-gray
                        px-3 py-2.5
                        transition-colors
                        focus-within:border-main-green
                    ">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-green">
                                <LockKeyhole className="size-5 text-main-green" />
                            </div>

                            <input
                                type={showRepeatPassword ? "password" : "text"}
                                className="min-w-0 flex-1 bg-transparent text-base outline-none"
                                placeholder="Повторите пароль"
                                name="repeatPassword"
                                onChange={handleClearInput}
                                autoComplete="new-password"
                            />

                            <button
                                type="button"
                                aria-label={showRepeatPassword ? "Показать пароль" : "Скрыть пароль"}
                                className="shrink-0 rounded-lg p-2 text-main-gray transition-colors hover:text-black cursor-pointer"
                                onClick={() => setShowRepeatPassword((prev) => !prev)}
                            >
                                <Eye className="size-5" />
                            </button>
                        </label>
                    )}

                    {isLogin && (
                        <button
                            type="button"
                            className="self-end text-sm text-text-green transition-colors hover:text-hover-green cursor-pointer"
                        >
                            Забыли пароль?
                        </button>
                    )}

                    {error && (
                        <div className="w-full wrap-break-words rounded-xl border border-red-200 bg-red-500 px-4 py-3 text-sm text-white">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="
                        flex h-12 w-full items-center justify-center
                        rounded-xl bg-main-green
                        text-base font-medium text-white
                        transition-colors cursor-pointer
                        hover:bg-hover-green 
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                    >
                        {isPending
                            ? "Подождите..."
                            : isLogin
                                ? "Войти"
                                : "Регистрация"}
                    </button>

                    <div className="flex w-full items-center text-main-gray">
                        <span className="h-px flex-1 bg-border-gray" />

                        <span className="px-3 text-center text-xs sm:px-4 sm:text-sm">
                            {isLogin
                                ? "или войдите через"
                                : "или зарегистрируйтесь через"}
                        </span>

                        <span className="h-px flex-1 bg-border-gray" />
                    </div>

                    <div className="text-center text-sm sm:text-left">
                        {isLogin
                            ? "Ещё нет аккаунта?"
                            : "Уже есть аккаунт?"}

                        <button
                            type="button"
                            className="text-text-green transition-colors hover:text-hover-green cursor-pointer"
                            onClick={() => { setIsLogin((prev) => !prev); setError("") }}
                        >
                            &nbsp;
                            {isLogin
                                ? "Зарегистрируйтесь"
                                : "Войти"}
                        </button>
                    </div>
                </form>

                <footer className="mt-auto pt-10 text-center text-xs text-main-gray sm:text-sm">
                    ©2026&nbsp;vseti.by&nbsp;—&nbsp;все права защищены
                </footer>

            </div>
        </div>
    )
}

export default Authorizate
