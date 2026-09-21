export type GeoChatPendingAttachment = {
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
}

export type GeoChatMessageAttachment = {
    id: string
    storagePath: string
    fileName: string
    mimeType: string
    sizeBytes: number
    url: string | null
}

export type UploadedGeoChatAttachment =
    GeoChatPendingAttachment