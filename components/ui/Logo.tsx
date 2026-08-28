import Image from "next/image"
import Link from "next/link"

function Logo() {
    return (
        <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
        >
            <Image
                src="/logo.svg"
                alt="logo"
                width={40}
                height={40}
                unoptimized
                priority
                className="size-9 sm:size-10"
            />

            <span className="text-xl font-bold sm:text-2xl">
                ВСети
            </span>
        </Link>
    )
}

export default Logo
