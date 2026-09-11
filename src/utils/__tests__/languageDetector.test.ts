import { describe, it, expect } from 'vitest'
import { detectLanguage, FALLBACK_LANGUAGE } from '../languageDetector'

describe('languageDetector', () => {
  it('detects TypeScript and React extensions correctly', () => {
    expect(detectLanguage('src/Toolbar.tsx')).toEqual({ id: 'tsx', name: 'TypeScript React' })
    expect(detectLanguage('src/utils/math.ts')).toEqual({ id: 'typescript', name: 'TypeScript' })
    expect(detectLanguage('index.js')).toEqual({ id: 'javascript', name: 'JavaScript' })
    expect(detectLanguage('App.jsx')).toEqual({ id: 'jsx', name: 'JavaScript React' })
  })

  it('detects systems and backend languages', () => {
    expect(detectLanguage('main.rs')).toEqual({ id: 'rust', name: 'Rust' })
    expect(detectLanguage('server.go')).toEqual({ id: 'go', name: 'Go' })
    expect(detectLanguage('script.py')).toEqual({ id: 'python', name: 'Python' })
    expect(detectLanguage('native.c')).toEqual({ id: 'c', name: 'C' })
    expect(detectLanguage('engine.cpp')).toEqual({ id: 'cpp', name: 'C++' })
    expect(detectLanguage('App.java')).toEqual({ id: 'java', name: 'Java' })
    expect(detectLanguage('Program.cs')).toEqual({ id: 'csharp', name: 'C#' })
  })

  it('detects data, style, and markup languages', () => {
    expect(detectLanguage('config.json')).toEqual({ id: 'json', name: 'JSON' })
    expect(detectLanguage('workflow.yaml')).toEqual({ id: 'yaml', name: 'YAML' })
    expect(detectLanguage('workflow.yml')).toEqual({ id: 'yaml', name: 'YAML' })
    expect(detectLanguage('styles.css')).toEqual({ id: 'css', name: 'CSS' })
    expect(detectLanguage('theme.scss')).toEqual({ id: 'scss', name: 'SCSS' })
    expect(detectLanguage('index.html')).toEqual({ id: 'html', name: 'HTML' })
    expect(detectLanguage('README.md')).toEqual({ id: 'markdown', name: 'Markdown' })
    expect(detectLanguage('query.sql')).toEqual({ id: 'sql', name: 'SQL' })
    expect(detectLanguage('deploy.sh')).toEqual({ id: 'bash', name: 'Shell' })
  })

  it('detects special filenames', () => {
    expect(detectLanguage('Dockerfile')).toEqual({ id: 'docker', name: 'Docker' })
    expect(detectLanguage('docker/Dockerfile')).toEqual({ id: 'docker', name: 'Docker' })
    expect(detectLanguage('.gitignore')).toEqual({ id: 'git', name: 'Git Ignore' })
    expect(detectLanguage('Makefile')).toEqual({ id: 'makefile', name: 'Makefile' })
  })

  it('handles windows backslashes and case variations', () => {
    expect(detectLanguage('c:\\project\\src\\main.TSX')).toEqual({ id: 'tsx', name: 'TypeScript React' })
    expect(detectLanguage('src\\INDEX.PY')).toEqual({ id: 'python', name: 'Python' })
  })

  it('falls back safely for unknown files or empty paths', () => {
    expect(detectLanguage('')).toEqual(FALLBACK_LANGUAGE)
    expect(detectLanguage(undefined)).toEqual(FALLBACK_LANGUAGE)
    expect(detectLanguage('LICENSE')).toEqual(FALLBACK_LANGUAGE)
    expect(detectLanguage('unknown.xyzabc')).toEqual(FALLBACK_LANGUAGE)
  })
})
