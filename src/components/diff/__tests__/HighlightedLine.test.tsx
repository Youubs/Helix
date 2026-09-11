import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { HighlightedLine } from '../HighlightedLine'

describe('HighlightedLine', () => {
  it('renders plain text when no language is provided', () => {
    const html = renderToStaticMarkup(<HighlightedLine content="hello world" />)
    expect(html).toContain('hello world')
  })

  it('tokenizes TypeScript code with keywords and strings', () => {
    const html = renderToStaticMarkup(
      <HighlightedLine content="const message: string = 'hello';" languageId="typescript" />
    )
    expect(html).toContain('class="token keyword">const</span>')
    expect(html).toContain('class="token string">&#x27;hello&#x27;</span>')
  })

  it('handles empty content gracefully without throwing', () => {
    const html = renderToStaticMarkup(<HighlightedLine content="" languageId="python" />)
    expect(html).toContain('<span class="inline-block font-mono "></span>')
  })

  it('tokenizes Python code correctly', () => {
    const html = renderToStaticMarkup(
      <HighlightedLine content="def calculate_total(x: int):" languageId="python" />
    )
    expect(html).toContain('class="token keyword">def</span>')
    expect(html).toContain('class="token function">calculate_total</span>')
  })

  it('tokenizes Rust code correctly', () => {
    const html = renderToStaticMarkup(
      <HighlightedLine content="pub fn main() -> Result<(), Error> {" languageId="rust" />
    )
    expect(html).toContain('class="token keyword">pub</span>')
    expect(html).toContain('class="token keyword">fn</span>')
    expect(html).toContain('class="token function-definition">main</span>')
  })

  it('tokenizes JSON code correctly', () => {
    const html = renderToStaticMarkup(
      <HighlightedLine content='  "name": "helix",' languageId="json" />
    )
    expect(html).toContain('class="token property">&quot;name&quot;</span>')
    expect(html).toContain('class="token string">&quot;helix&quot;</span>')
  })
})
