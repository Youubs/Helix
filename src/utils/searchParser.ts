import type { CommitNode } from '@/shared/types'

export interface ParsedSearchQuery {
  raw: string
  author?: string
  message?: string
  file?: string
  text?: string
}

export function parseSearchQuery(query: string): ParsedSearchQuery {
  const result: ParsedSearchQuery = { raw: query.trim() }
  if (!query.trim()) return result

  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) || []
  const textParts: string[] = []

  for (const token of tokens) {
    const cleanToken = token.replace(/^"(.*)"$/, '$1')
    if (cleanToken.startsWith('author:')) {
      result.author = cleanToken.slice(7).toLowerCase()
    } else if (cleanToken.startsWith('message:')) {
      result.message = cleanToken.slice(8).toLowerCase()
    } else if (cleanToken.startsWith('file:')) {
      result.file = cleanToken.slice(5).toLowerCase()
    } else {
      textParts.push(cleanToken.toLowerCase())
    }
  }

  if (textParts.length > 0) {
    result.text = textParts.join(' ')
  }

  return result
}

export function filterCommits(commits: CommitNode[], query: string): CommitNode[] {
  const parsed = parseSearchQuery(query)
  if (!parsed.raw) return commits

  return commits.filter((commit) => {
    if (parsed.author && !commit.authorName.toLowerCase().includes(parsed.author) && !commit.authorEmail.toLowerCase().includes(parsed.author)) {
      return false
    }

    if (parsed.message && !commit.message.toLowerCase().includes(parsed.message)) {
      return false
    }

    if (parsed.text) {
      const matchMsg = commit.message.toLowerCase().includes(parsed.text)
      const matchAuthor = commit.authorName.toLowerCase().includes(parsed.text)
      const matchHash = commit.hash.toLowerCase().includes(parsed.text) || commit.abbreviatedHash.toLowerCase().includes(parsed.text)
      if (!matchMsg && !matchAuthor && !matchHash) return false
    }

    return true
  })
}
