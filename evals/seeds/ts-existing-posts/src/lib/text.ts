export function slugify(s: string): string {
  return s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function truncate(s: string, max: number, ellipsis = '…'): string {
  if (s.length <= max) return s
  const cut = s.slice(0, max - ellipsis.length)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut) + ellipsis
}

export function stripMarkdown(s: string): string {
  return s.replace(/[*_`#>]+/g, '').replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
}
