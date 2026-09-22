"use server"

import { loadDirectConversations } from "@/lib/messages/loadDirectConversations"

export async function getDirectConversations() {
    return loadDirectConversations()
}