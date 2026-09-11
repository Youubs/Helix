import { DiffFile, DiffHunk, DiffLine } from '@/shared/types'

export function parseDiff(raw?: string | null): DiffFile[] {
  if (!raw || typeof raw !== 'string') return []
  const files: DiffFile[] = []
  const normalized = raw.replace(/\r\n/g, '\n')
  const fileChunks = normalized.split(/^diff --git /m).filter(Boolean)

  for (const chunk of fileChunks) {
    const lines = chunk.split('\n')
    let file = ''
    let status: DiffFile['status'] = 'modified'
    let additions = 0
    let deletions = 0
    const hunks: DiffHunk[] = []

    // Parse header
    const headerMatch = lines[0]?.match(/a\/(.+?) b\/(.+)/) || lines[0]?.match(/b\/(.+)/)
    if (headerMatch) {
      file = (headerMatch[2] || headerMatch[1] || '').replace(/^["']|["']$/g, '')
    } else {
      const plusMatch = lines.find((l) => l.startsWith('+++ b/'))
      if (plusMatch) {
        file = plusMatch.replace('+++ b/', '').trim()
      }
    }

    for (const line of lines) {
      if (line.startsWith('new file')) status = 'added'
      if (line.startsWith('deleted file')) status = 'deleted'
      if (line.startsWith('rename from')) status = 'renamed'
    }

    // Parse hunks
    let currentHunk: DiffHunk | null = null
    let oldLine = 0
    let newLine = 0

    for (const line of lines) {
      const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/)
      if (hunkMatch) {
        if (currentHunk) hunks.push(currentHunk)
        oldLine = parseInt(hunkMatch[1], 10)
        newLine = parseInt(hunkMatch[3], 10)
        currentHunk = {
          header: line,
          oldStart: oldLine,
          oldLines: parseInt(hunkMatch[2] ?? '1', 10),
          newStart: newLine,
          newLines: parseInt(hunkMatch[4] ?? '1', 10),
          lines: []
        }
        continue
      }

      if (!currentHunk) continue

      if (line.startsWith('+') && !line.startsWith('+++')) {
        additions++
        currentHunk.lines.push({
          type: 'add',
          content: line.slice(1),
          newLineNumber: newLine++
        })
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        deletions++
        currentHunk.lines.push({
          type: 'remove',
          content: line.slice(1),
          oldLineNumber: oldLine++
        })
      } else if (line.startsWith(' ')) {
        currentHunk.lines.push({
          type: 'context',
          content: line.slice(1),
          oldLineNumber: oldLine++,
          newLineNumber: newLine++
        })
      }
    }

    if (currentHunk) hunks.push(currentHunk)

    const finalFile = file || lines[0]?.replace(/^diff --git /, '').trim() || 'modified_file'
    files.push({ file: finalFile, status, additions, deletions, hunks: hunks || [] })
  }

  return files
}

export function parseSingleFileDiff(raw?: string | null): DiffHunk[] {
  if (!raw || typeof raw !== 'string') return []
  const hunks: DiffHunk[] = []
  const normalized = raw.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  let currentHunk: DiffHunk | null = null
  let oldLine = 0
  let newLine = 0

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)/)
    if (hunkMatch) {
      if (currentHunk) hunks.push(currentHunk)
      oldLine = parseInt(hunkMatch[1], 10)
      newLine = parseInt(hunkMatch[3], 10)
      currentHunk = {
        header: line,
        oldStart: oldLine,
        oldLines: parseInt(hunkMatch[2] ?? '1', 10),
        newStart: newLine,
        newLines: parseInt(hunkMatch[4] ?? '1', 10),
        lines: []
      }
      continue
    }

    if (!currentHunk) continue

    if (line.startsWith('+') && !line.startsWith('+++')) {
      currentHunk.lines.push({
        type: 'add',
        content: line.slice(1),
        newLineNumber: newLine++
      })
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      currentHunk.lines.push({
        type: 'remove',
        content: line.slice(1),
        oldLineNumber: oldLine++
      })
    } else if (line.startsWith(' ')) {
      currentHunk.lines.push({
        type: 'context',
        content: line.slice(1),
        oldLineNumber: oldLine++,
        newLineNumber: newLine++
      })
    }
  }

  if (currentHunk) hunks.push(currentHunk)
  return hunks
}
