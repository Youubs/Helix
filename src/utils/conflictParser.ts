export interface ConflictBlock {
  id: string
  ours: string
  theirs: string
  base?: string
  startLine: number
  endLine: number
}

export function parseConflictFile(content: string): ConflictBlock[] {
  const lines = content.split('\n')
  const conflicts: ConflictBlock[] = []
  let inConflict = false
  let currentOurs: string[] = []
  let currentTheirs: string[] = []
  let conflictStart = 0
  let isTheirsSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('<<<<<<<')) {
      inConflict = true
      conflictStart = i
      currentOurs = []
      currentTheirs = []
      isTheirsSection = false
    } else if (line.startsWith('=======') && inConflict) {
      isTheirsSection = true
    } else if (line.startsWith('>>>>>>>') && inConflict) {
      conflicts.push({
        id: `conflict-${conflictStart}`,
        ours: currentOurs.join('\n'),
        theirs: currentTheirs.join('\n'),
        startLine: conflictStart,
        endLine: i
      })
      inConflict = false
    } else if (inConflict) {
      if (isTheirsSection) {
        currentTheirs.push(line)
      } else {
        currentOurs.push(line)
      }
    }
  }

  return conflicts
}
