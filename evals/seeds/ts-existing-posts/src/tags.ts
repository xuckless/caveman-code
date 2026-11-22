import { slugify } from './lib/text.ts'

export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map(slugify).filter(Boolean))]
}
