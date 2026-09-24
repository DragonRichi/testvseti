type Props = {
    className?: string
}

function Notifications({
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
                d="M12.9999 18.9988C16.6913 18.9995 19.6256 17.8643 21.3373 16.9906C22.1795 16.5607 22.175 15.45 21.3881 14.9254C20.5355 14.357 20.0751 13.3587 20.071 12.3339C20.0604 9.70205 19.4945 4.83425 15.4999 4.39443C15.4999 4.39443 15.4999 2 12.9999 2C10.5 2 10.5 4.39443 10.5 4.39443C6.50525 4.83427 5.9395 9.7025 5.92904 12.3342C5.92497 13.3588 5.46465 14.3569 4.61216 14.9252C3.82531 15.4498 3.82097 16.5606 4.66336 16.9903C6.37505 17.8635 9.30907 18.998 12.9999 18.9988Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
            />
            <path
                d="M8.51343 18.15C8.95747 19.8753 10.5236 21.15 12.3874 21.15C14.2512 21.15 15.8174 19.8753 16.2614 18.15"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    )
}

export default Notifications