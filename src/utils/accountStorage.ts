/** Adds the current BOSS account id to account-owned local storage keys. */
export function accountStorageKey(key: string): string {
  const uid = (globalThis as any)?._PAGE?.encryptUserId
  return uid ? `${key}:${uid}` : key
}
