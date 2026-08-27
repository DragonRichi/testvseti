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

        if (isLogin) {

            if (!email || !password) {
                setError("Заполните все поля")
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
        <div className="flex flex-col gap-4 max-w-[1550] mx-auto min-h-screen items-center">
            <Link href="/" className="text-5xl font-bold" >
                vseti<span className="text-main-green">.by</span>
            </Link>
            <div className="text-main-gray">Социльная сеть для своих</div>
            <div className="text-3xl font-bold">{isLogin ? "Вход в аккаунт" : "Создание аккаунта"}</div>
            <div className="">{isLogin ? "Добро пожаловать обратно! Пожалуйста, войдите в свой аккаунт" : "Присоединяйтесь к vseti.by и общайтесь с друзьями и близкими"}</div>
            <form
                key={isLogin ? "login" : "register"}
                onSubmit={handleSubmit}
                className="flex flex-col gap-4 flex-wrap w-full"
            >
                {!isLogin && (
                    <>
                        <div className="flex gap-2">
                            <label className="flex flex-wrap gap-3 border border-border-gray rounded-xl px-4 py-2 items-center focus-within:border-black">
                                <div className="bg-bg-green p-2 rounded-xl">
                                    <UserRound color="green" />
                                </div>
                                <input placeholder="Имя" name="name" type="text" className="flex-1 outline-0" onChange={handleClearInput} />
                            </label>
                            <label className="flex flex-wrap gap-3 border border-border-gray rounded-xl px-4 py-2 items-center focus-within:border-black">
                                <div className="bg-bg-green p-2 rounded-xl">
                                    <UserRound color="green" />
                                </div>
                                <input placeholder="Фамилия" name="surname" type="text" className="flex-1 outline-0" onChange={handleClearInput} />
                            </label>
                        </div>

                    </>
                )}

                <label className="flex flex-wrap gap-3 border border-border-gray rounded-xl px-4 py-2 items-center focus-within:border-black">
                    <div className="bg-bg-green p-2 rounded-xl">
                        <Mail color="green" />
                    </div>
                    <input placeholder="Email" name="email" type="email" className="flex-1 outline-0 " onChange={handleClearInput} />
                </label>
                <label className="flex border border-border-gray rounded-xl px-4 py-2 gap-3 flex-wrap items-center focus-within:border-black">
                    <div className="bg-bg-green p-2 rounded-xl">
                        <LockKeyhole color="green" />
                    </div>
                    <input
                        type={showPassword ? "password" : "text"}
                        className="flex-1 outline-0 "
                        placeholder="Пароль"
                        name="password"
                        onChange={handleClearInput}
                    />
                    <div
                        className="cursor-pointer"
                        onClick={() => setShowPassword((prev) => !prev)}>
                        <Eye />
                    </div>
                </label>
                {!isLogin && (
                    <label className="flex border border-border-gray rounded-xl px-4 py-2 gap-3 flex-wrap items-center focus-within:border-black">
                        <div className="bg-bg-green p-2 rounded-xl">
                            <LockKeyhole color="green" />
                        </div>
                        <input
                            type={showRepeatPassword ? "password" : "text"}
                            className="flex-1 outline-0 "
                            placeholder="Повторите пароль"
                            name="repeatPassword"
                            onChange={handleClearInput}
                        />
                        <div
                            className="cursor-pointer"
                            onClick={() => setShowRepeatPassword((prev) => !prev)}>
                            <Eye />
                        </div>
                    </label>
                )}

                {isLogin && <button type="button" className="text-text-green cursor-pointer self-end hover:text-hover-green transition-colors">Забыли пароль?</button>}
                {error && (<div className="rounded-xl bg-red-500 border border-red-200 px-4 py-3 text-white">{error}</div>)}
                <button
                    disabled={isPending}
                    className="bg-main-green text-white py-3 rounded-xl cursor-pointer hover:bg-hover-green transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isPending ? "Подождите..." : isLogin ? "Войти" : "Регистрация"}
                </button>
                <div className="flex items-center w-full text-main-gray">
                    <span className="border-b-2  flex-1" ></span>
                    <span className="whitespace-nowrap px-4">{isLogin ? "или войдите через" : "или зарегистрируйтесь через"}</span>
                    <span className="border-b-2  flex-1" ></span>
                </div>
                <div>{isLogin ? "Ещё нет аккаунта?" : "Уже есть аккаунт?"}
                    <button
                        type="button"
                        className="text-text-green cursor-pointer hover:text-hover-green transition-colors"
                        onClick={() => setIsLogin((prev) => !prev)}
                    >&nbsp;
                        {isLogin ? "Зарегистрируйтесь" : "Войти"}
                    </button>
                </div>
            </form>
            <footer className="mt-auto pb-5">
                ©2026&nbsp;vseti.by&nbsp;—&nbsp;все права защищены
            </footer>
        </div>
    )
}

export default Authorizate
