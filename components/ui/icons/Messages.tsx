type Props = {
    className?: string
}

function Messages({
    className = "size-6"
}: Props) {
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            className={className}
            aria-hidden="true"
        >
            <path
                d="M23 22C23 17.03 21.133 13 13 13C5.133 13 3 17.03 3 22C3 24.071 3.37 25.98 4.372 27.5C5.632 29.5 4.992 31.333 4 32C5.615 32 6.702 31.486 7.392 30.977C7.882 30.615 8.507 30.437 9.098 30.581C10.207 30.853 11.499 31 13 31C20.133 31 23 26.97 23 22Z"
                transform="translate(0 -10)"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
        </svg>
    )
}

export default Messages