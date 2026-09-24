"use client"

import type { DirectConversationSummary } from "@/types/directMessages"
import { LoaderCircle, MessageCircle, Search } from "lucide-react"
import DirectConversationRow from "./DirectConversationRow"
import useDirectConversationListRealtime from "./useDirectConversationListRealtime"
import useDirectConversationSearch from "./useDirectConversationSearch"

type Props = {
    initialConversations: DirectConversationSummary[]
    currentProfileId: string
}

function DirectConversationList({ initialConversations, currentProfileId }: Props) {
    const conversations = useDirectConversationListRealtime({ initialConversations, currentProfileId })
    const { query, setQuery, filtered, isSearchingMessages } = useDirectConversationSearch(conversations)

    return (
        <section className="overflow-hidden rounded-[18px] bg-white shadow-[0_1px_0_rgba(18,24,18,0.04)]">
            <div className="border-b border-[#ecefec] px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-[20px] font-bold tracking-[-0.02em] text-[#151915]">Сообщения</h1>
                        <div className="mt-0.5 text-[11px] text-[#9aa09b]">Личные диалоги</div>
                    </div>
                </div>

                <label className="mt-3 flex h-10 items-center gap-2 rounded-full bg-[#f2f4f1] px-3.5 transition-colors focus-within:bg-[#edf1ec]">
                    <Search className="size-4 shrink-0 text-[#8d938e]" />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по диалогам и сообщениям" className="min-w-0 flex-1 bg-transparent text-[16px] text-[#222722] outline-none placeholder:text-[#9ca19d] lg:text-sm" />
                    {isSearchingMessages && <LoaderCircle className="size-4 shrink-0 animate-spin text-[#8d938e]" />}
                </label>
            </div>

            {filtered.length === 0 ? (
                <div className="flex min-h-[360] flex-col items-center justify-center px-6 py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-full bg-[#edf9ee] text-main-green"><MessageCircle className="size-5" /></div>
                    <div className="mt-4 font-semibold text-[#202520]">{query.trim() ? "Ничего не найдено" : "Пока нет сообщений"}</div>
                    <div className="mt-1 max-w-[360] text-sm leading-6 text-[#8d938e]">{query.trim() ? "Попробуйте изменить поисковый запрос." : "Откройте профиль пользователя и нажмите «Написать», чтобы начать переписку."}</div>
                </div>
            ) : (
                <div className="divide-y divide-[#eef0ed]">
                    {filtered.map((item) => <DirectConversationRow key={item.conversation.id} item={item} currentProfileId={currentProfileId} />)}
                </div>
            )}
        </section>
    )
}

export default DirectConversationList
