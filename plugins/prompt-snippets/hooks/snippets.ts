import type { Snippet } from '../types'

export function parseSnippet(filename: string, raw: string): Snippet | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const [, frontmatter = '', rawBody = ''] = match ?? []
  if (!match) return null

  const meta: Record<string, string> = {}
  for (const line of frontmatter.split(/\r?\n/)) {
    const [, key, value] = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/) ?? []
    if (key !== undefined && value !== undefined) {
      meta[key.toLowerCase()] = value.trim().replace(/^["']|["']$/g, '')
    }
  }

  const body = rawBody.trim()
  if (!body) return null

  const parsedOrder = Number.parseInt(meta.order ?? '', 10)
  return {
    id: filename,
    name: meta.name || filename.replace(/\.md$/i, ''),
    description: meta.description ?? '',
    placement: meta.placement === 'prepend' ? 'prepend' : 'append',
    order: Number.isFinite(parsedOrder) ? parsedOrder : 9999,
    body,
  }
}

export function sortSnippets(snippets: readonly Snippet[]): Snippet[] {
  const byOrder = (a: Snippet, b: Snippet) =>
    a.order - b.order || a.name.localeCompare(b.name)
  return [
    ...snippets.filter(s => s.placement === 'prepend').sort(byOrder),
    ...snippets.filter(s => s.placement === 'append').sort(byOrder),
  ]
}

/** Prepend bodies, then the typed text, then append bodies, separated by blank lines. */
export function applySnippets(text: string, active: readonly Snippet[]): string {
  const sorted = sortSnippets(active)
  const prepends = sorted.filter(s => s.placement === 'prepend').map(s => s.body)
  const appends = sorted.filter(s => s.placement === 'append').map(s => s.body)
  return [...prepends, text, ...appends].join('\n\n')
}

