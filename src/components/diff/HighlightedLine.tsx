import React, { useMemo } from 'react'
import Prism from 'prismjs'

// Import Prism language grammars
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-tsx'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-rust'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-c'
import 'prismjs/components/prism-cpp'
import 'prismjs/components/prism-csharp'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-sql'

interface HighlightedLineProps {
  content: string
  languageId?: string
  className?: string
}

function renderToken(token: string | Prism.Token, key: string | number): React.ReactNode {
  if (typeof token === 'string') {
    return token
  }

  const { type, content } = token

  let children: React.ReactNode = null
  if (typeof content === 'string') {
    children = content
  } else if (Array.isArray(content)) {
    children = content.map((child, idx) => renderToken(child, `${key}-${idx}`))
  } else if (typeof content === 'object' && content !== null) {
    children = renderToken(content as Prism.Token, `${key}-nested`)
  }

  return (
    <span key={key} className={`token ${type}`}>
      {children}
    </span>
  )
}

export const HighlightedLine = React.memo(function HighlightedLine({
  content,
  languageId = 'plaintext',
  className = ''
}: HighlightedLineProps) {
  const renderedTokens = useMemo(() => {
    if (!content) {
      return null
    }

    const grammar = Prism.languages[languageId] || (languageId !== 'plaintext' && Prism.languages.clike)

    if (!grammar) {
      return content
    }

    try {
      const tokens = Prism.tokenize(content, grammar)
      return tokens.map((token, i) => renderToken(token, i))
    } catch {
      return content
    }
  }, [content, languageId])

  return (
    <span className={`inline-block font-mono ${className}`}>
      {renderedTokens}
    </span>
  )
})
