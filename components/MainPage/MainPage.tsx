"use client"

import Link from "next/link"

function MainPage() {
    return (
        <Link href="/auth" className=" mx-auto mt-5 border rounded-2xl px-3 py-1 flex self-start">
            Авторизация
        </Link>
    )
}

export default MainPage
