export function nowIso() {
  return new Date().toISOString()
}

export function ensureUpdatedAt<T extends { updatedAt?: string }>(item: T): T & { updatedAt: string } {
  return {
    ...item,
    updatedAt: item.updatedAt ?? nowIso(),
  }
}

export function ensureUpdatedAtList<T extends { updatedAt?: string }>(items: T[]): Array<T & { updatedAt: string }> {
  return items.map(ensureUpdatedAt)
}
