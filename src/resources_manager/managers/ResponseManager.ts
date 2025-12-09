import type { DataManager } from './DataManager'

interface UpsertOptions<TDataset extends object, TEntity> {
  collectionKey: keyof TDataset
  entity: TEntity
  matcher?: (candidate: TEntity) => boolean
  appendIfMissing?: boolean
  ensureDataset?: () => TDataset
}

interface SanitizeOptions<TPayload extends object> {
  omitKeys?: Array<keyof TPayload>
}

export class ResponseManager {
  sanitizePayload<TPayload extends object>(
    payload: TPayload,
    options: SanitizeOptions<TPayload> = {},
  ): Partial<TPayload> {
    const omitSet = new Set(options.omitKeys ?? [])
    const entries = Object.entries(payload).filter(([key, value]) => {
      if (omitSet.has(key as keyof TPayload)) {
        return false
      }
      if (value == null) {
        return false
      }
      if (typeof value === 'string' && !value.trim()) {
        return false
      }
      return true
    })

    return Object.fromEntries(entries) as Partial<TPayload>
  }

  resolveEntityFromResponse<TEntity>(data: unknown): Partial<TEntity> | null {
    if (data == null) {
      return null
    }

    if (Array.isArray(data)) {
      return (data[0] as Partial<TEntity>) ?? null
    }

    if (typeof data === 'object') {
      const record = data as Record<string, unknown>
      if (Array.isArray(record.items) && record.items.length > 0) {
        return record.items[0] as Partial<TEntity>
      }
      if (record.instance && typeof record.instance === 'object') {
        return record.instance as Partial<TEntity>
      }
    }

    return data as Partial<TEntity>
  }

  mergeWithFallback<TEntity>(responseEntity: Partial<TEntity> | null, fallback: TEntity): TEntity {
    if (!responseEntity) {
      return fallback
    }
    return {
      ...fallback,
      ...responseEntity,
    }
  }

  upsertEntity<TDataset extends object, TEntity>(
    manager: DataManager<TDataset>,
    options: UpsertOptions<TDataset, TEntity>,
  ): void {
    const { collectionKey, entity, matcher, appendIfMissing = true, ensureDataset } = options
    manager.updateDataset((dataset) => {
      const baseDataset = dataset ?? ensureDataset?.() ?? null
      if (!baseDataset) {
        return dataset
      }

      const currentCollection = baseDataset[collectionKey]
      if (!Array.isArray(currentCollection)) {
        return baseDataset
      }

      const compare =
        matcher ??
        ((candidate: TEntity) => {
          const candidateId = (candidate as Record<string, unknown>)?.id
          const entityId = (entity as Record<string, unknown>)?.id
          return candidateId != null && entityId != null && candidateId === entityId
        })

      const index = currentCollection.findIndex((item) => compare(item as TEntity))
      let nextCollection: TEntity[]
      if (index >= 0) {
        nextCollection = [...currentCollection]
        nextCollection[index] = entity
      } else if (appendIfMissing) {
        nextCollection = [...currentCollection, entity]
      } else {
        return baseDataset
      }

      return {
        ...baseDataset,
        [collectionKey]: nextCollection,
      }
    })
  }
}
