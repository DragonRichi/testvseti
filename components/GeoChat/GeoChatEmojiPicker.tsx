"use client"

const EMOJIS = [
    "😀", "😃", "😄", "😁", "😂", "🤣", "😊", "😉", "😍", "🥰",
    "😘", "😋", "😎", "🤩", "🥳", "😅", "🙂", "🙃", "🤔", "😢",
    "😭", "😡", "😱", "😴", "🤗", "🤭", "❤️", "🧡", "💛", "💚",
    "💙", "💜", "🖤", "🤍", "💔", "💕", "💯", "👍", "👎", "👏",
    "🙏", "💪", "🤝", "✌️", "🤟", "👌", "👀", "🔥", "🎉", "🎊",
    "✨", "⭐", "💫", "🚀", "✅", "❌", "⚡", "🌍", "☀️", "🌙",
    "🌧️", "❄️", "🌈", "🌊", "🌳", "📍", "📸", "🎥", "🎵", "🎧",
    "⚽", "🏀", "🏆", "🎮", "💻"
]

type Props = {
    onSelect: (emoji: string) => void
}

function GeoChatEmojiPicker({
    onSelect
}: Props) {
    return (
        <div className="absolute bottom-full left-0 z-30 mb-2 w-[280] rounded-2xl border border-green-100 bg-white p-2 shadow-lg sm:w-[320]">
            <div className="grid max-h-[220] grid-cols-8 gap-1 overflow-y-auto">
                {EMOJIS.map((emoji, index) => (
                    <button
                        key={`${emoji}-${index}`}
                        type="button"
                        onPointerDown={(event) => {
                            event.preventDefault()
                        }}
                        onClick={() => onSelect(emoji)}
                        className="flex aspect-square cursor-pointer items-center justify-center rounded-lg text-xl transition-colors hover:bg-green-50"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default GeoChatEmojiPicker