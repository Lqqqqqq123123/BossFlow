import type { CustomGreetingItem, FormDataInput } from '../types/formData.ts'

export function normalizeGreetingMessages(value: FormDataInput['value']): CustomGreetingItem[] {
  return typeof value === 'string' ? [{ type: 'text', content: value }] : value
}

export function createClientMidFactory(now: () => number = Date.now) {
  let previous = 0
  return () => {
    const current = now()
    previous = Math.max(current, previous + 1)
    return previous
  }
}
