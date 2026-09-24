type Props = {
    className?: string
}

function CreatePostAvatar({
    className = "size-11"
}: Props) {
    return (
        <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" fill="none" className={className} aria-hidden="true">
            <defs>
                <filter id="create-post-avatar-shadow" width="44" height="44" x="0" y="0" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend result="shape" in="SourceGraphic" in2="BackgroundImageFix" mode="normal" />
                    <feColorMatrix result="hardAlpha" in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" />
                    <feMorphology radius="2" operator="erode" />
                    <feGaussianBlur stdDeviation="3" />
                    <feComposite k2="-1" k3="1" in2="hardAlpha" operator="arithmetic" />
                    <feColorMatrix type="matrix" values="0 0 0 0 0.85098 0 0 0 0 0.85098 0 0 0 0 0.85098 0 0 0 1 0" />
                    <feBlend result="innerShadow" in2="shape" mode="normal" />
                </filter>

                <radialGradient id="create-post-avatar-gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(34.6667,0,0,19.5,22,30)">
                    <stop stopColor="#ffffff" />
                    <stop offset="0.48323" stopColor="#fefefe" />
                    <stop offset="1" stopColor="#ebebeb" />
                </radialGradient>
            </defs>

            <g filter="url(#create-post-avatar-shadow)">
                <rect width="44" height="44" rx="22" fill="#d9d9d9" />

                <ellipse rx="16" ry="9" cx="22" cy="39" fill="url(#create-post-avatar-gradient)" />

                <path
                    d="M14.4361 9.15796C15.177 8.78761 16.0783 9.088 16.4488 9.82886L18.0533 13.0388C19.321 12.6898 20.6808 12.4998 22.107 12.4998C23.7271 12.4998 25.2612 12.7452 26.6725 13.1902L26.7633 13.1208C28.1811 12.0217 29.8129 11.2298 31.5533 10.7947C32.3568 10.5939 33.1705 11.0822 33.3717 11.8855C33.5726 12.6891 33.0844 13.5038 32.2809 13.7048C31.4356 13.9161 30.6237 14.2371 29.8658 14.658C31.9514 15.9598 33.572 17.7637 34.5035 19.823C35.7777 22.6403 35.743 25.9106 33.8668 28.8142C32.6886 30.6374 30.817 31.6504 29.0562 32.2214C27.284 32.7962 25.4591 32.9782 24.1383 33.0261C22.7855 33.0752 21.4286 33.0752 20.0758 33.0261C18.755 32.9782 16.93 32.7961 15.1578 32.2214C13.3972 31.6504 11.5254 30.6373 10.3473 28.8142C8.47109 25.9106 8.43627 22.6403 9.71054 19.823C10.7724 17.4755 12.7291 15.4602 15.2506 14.1423L13.7652 11.1707C13.3948 10.4297 13.6953 9.52847 14.4361 9.15796ZM16.857 21.4998C16.1667 21.4998 15.607 22.0594 15.607 22.7498V24.4998C15.607 25.1901 16.1667 25.7498 16.857 25.7498C17.5474 25.7497 18.107 25.1901 18.107 24.4998V22.7498C18.107 22.0594 17.5474 21.4998 16.857 21.4998ZM27.357 21.4998C26.6667 21.4998 26.107 22.0594 26.107 22.7498V24.4998C26.107 25.1901 26.6667 25.7498 27.357 25.7498C28.0474 25.7497 28.607 25.1901 28.607 24.4998V22.7498C28.607 22.0594 28.0474 21.4998 27.357 21.4998Z"
                    fill="#ffffff"
                    fillRule="evenodd"
                />
            </g>
        </svg>
    )
}

export default CreatePostAvatar