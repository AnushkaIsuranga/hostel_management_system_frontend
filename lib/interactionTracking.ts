import { InteractionEventsApi } from '@/lib/backendApi'
import { getAccessToken, getStoredUserId } from '@/lib/auth'
import { ApiInteractionType, type Guid } from '@/types/backend'

const SESSION_STORAGE_KEY = 'hms_interaction_session_id'

type EventMetadata = Record<string, unknown>

type TrackInteractionParams = {
  eventType: ApiInteractionType
  hostelId?: Guid
  metadata?: EventMetadata
}

function canUseSessionStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'
}

function getSessionId(): string {
  if (!canUseSessionStorage()) return 'ssr-session'

  const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (existing && existing.trim()) return existing

  const next = crypto.randomUUID()
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, next)
  return next
}

function normalizeMetadata(metadata?: EventMetadata): EventMetadata | null {
  if (!metadata) return null
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined)
  if (entries.length === 0) return null
  return Object.fromEntries(entries)
}

export async function trackInteractionEvent({
  eventType,
  hostelId,
  metadata,
}: TrackInteractionParams): Promise<void> {
  try {
    await InteractionEventsApi.create(
      {
        userId: getStoredUserId() ?? null,
        hostelId: hostelId ?? null,
        eventType,
        sessionId: getSessionId(),
        eventData: normalizeMetadata(metadata),
      },
      getAccessToken(),
    )
  } catch {
    // Intentionally swallow errors so tracking never breaks user flows.
  }
}

export { ApiInteractionType }
