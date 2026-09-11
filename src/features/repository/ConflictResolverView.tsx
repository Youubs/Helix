import React, { useState } from 'react'
import { Check, ArrowLeft, ShieldAlert } from 'lucide-react'
import { parseConflictFile, ConflictBlock } from '@/utils/conflictParser'

interface ConflictResolverViewProps {
  filePath: string
  fileContent: string
  onSave: (resolvedContent: string) => void
  onClose: () => void
}

export function ConflictResolverView({
  filePath,
  fileContent,
  onSave,
  onClose
}: ConflictResolverViewProps) {
  const [conflicts] = useState<ConflictBlock[]>(() => parseConflictFile(fileContent))
  const [resolutions, setResolutions] = useState<Record<string, 'ours' | 'theirs' | 'both'>>({})

  const handleChoose = (conflictId: string, choice: 'ours' | 'theirs' | 'both') => {
    setResolutions((prev) => ({ ...prev, [conflictId]: choice }))
  }

  const handleApplyResolution = () => {
    const lines = fileContent.split('\n')
    const resultLines: string[] = []
    let i = 0

    while (i < lines.length) {
      if (lines[i].startsWith('<<<<<<<')) {
        const conflictStart = i
        const conflict = conflicts.find((c) => c.startLine === conflictStart)
        if (conflict) {
          const choice = resolutions[conflict.id] || 'ours'
          if (choice === 'ours') {
            resultLines.push(...conflict.ours.split('\n'))
          } else if (choice === 'theirs') {
            resultLines.push(...conflict.theirs.split('\n'))
          } else {
            resultLines.push(...conflict.ours.split('\n'), ...conflict.theirs.split('\n'))
          }
          i = conflict.endLine + 1
          continue
        }
      }
      resultLines.push(lines[i])
      i++
    }

    onSave(resultLines.join('\n'))
  }

  return (
    <div className="h-full flex flex-col bg-[var(--bg-app)] select-none">
      {/* Header Bar */}
      <div className="h-9 flex items-center justify-between px-3 border-b border-[var(--border-default)] bg-[var(--bg-header)] shrink-0">
        <div className="flex items-center gap-2 text-xs font-medium">
          <button onClick={onClose} className="flex items-center gap-1 text-[var(--accent-primary)] hover:underline mr-2">
            <ArrowLeft size={13} />
            <span>Cancel</span>
          </button>
          <ShieldAlert size={14} className="text-[var(--color-warning)]" />
          <span className="text-[var(--text-primary)] font-mono">{filePath}</span>
          <span className="text-[10px] bg-[var(--color-warning)]/20 text-[var(--color-warning)] px-1.5 py-0.5 rounded font-mono">
            {conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}
          </span>
        </div>

        <button
          onClick={handleApplyResolution}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-[var(--accent-primary)] text-white font-medium rounded hover:brightness-110"
        >
          <Check size={13} />
          <span>Save Resolved File</span>
        </button>
      </div>

      {/* 3-Way Grid Editor */}
      <div className="flex-1 overflow-auto p-4 space-y-4 font-mono text-xs">
        {conflicts.map((conflict, idx) => (
          <div key={conflict.id} className="border border-[var(--border-default)] rounded bg-[var(--bg-surface)] overflow-hidden">
            <div className="px-3 py-1 bg-[var(--bg-elevated)] border-b border-[var(--border-default)] flex justify-between items-center text-[11px] font-bold text-[var(--text-secondary)]">
              <span>Conflict #{idx + 1}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChoose(conflict.id, 'ours')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    resolutions[conflict.id] === 'ours'
                      ? 'bg-[var(--accent-primary)] text-white font-bold'
                      : 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  Accept Ours (Current)
                </button>
                <button
                  onClick={() => handleChoose(conflict.id, 'theirs')}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    resolutions[conflict.id] === 'theirs'
                      ? 'bg-[var(--accent-primary)] text-white font-bold'
                      : 'bg-[var(--bg-hover)] text-[var(--text-primary)]'
                  }`}
                >
                  Accept Theirs (Incoming)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-[var(--border-default)] text-xs">
              {/* Ours Pane */}
              <div className="p-3 bg-[var(--diff-add-bg)]/20">
                <div className="text-[10px] font-bold text-[var(--diff-add-text)] mb-1">OURS (Current Change)</div>
                <pre className="whitespace-pre text-[var(--text-primary)]">{conflict.ours || '(Empty)'}</pre>
              </div>

              {/* Theirs Pane */}
              <div className="p-3 bg-[var(--diff-del-bg)]/20">
                <div className="text-[10px] font-bold text-[var(--diff-del-text)] mb-1">THEIRS (Incoming Change)</div>
                <pre className="whitespace-pre text-[var(--text-primary)]">{conflict.theirs || '(Empty)'}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
