export interface DetectedLanguage {
  id: string
  name: string
}

const SPECIAL_FILENAMES: Record<string, DetectedLanguage> = {
  dockerfile: { id: 'docker', name: 'Docker' },
  makefile: { id: 'makefile', name: 'Makefile' },
  '.gitignore': { id: 'git', name: 'Git Ignore' },
  '.gitattributes': { id: 'git', name: 'Git Attributes' },
  '.env': { id: 'bash', name: 'Environment' },
  cmakelists: { id: 'cmake', name: 'CMake' }
}

const EXTENSION_MAP: Record<string, DetectedLanguage> = {
  // TypeScript / JavaScript
  ts: { id: 'typescript', name: 'TypeScript' },
  mts: { id: 'typescript', name: 'TypeScript' },
  cts: { id: 'typescript', name: 'TypeScript' },
  tsx: { id: 'tsx', name: 'TypeScript React' },
  js: { id: 'javascript', name: 'JavaScript' },
  mjs: { id: 'javascript', name: 'JavaScript' },
  cjs: { id: 'javascript', name: 'JavaScript' },
  jsx: { id: 'jsx', name: 'JavaScript React' },

  // Systems / Backend
  rs: { id: 'rust', name: 'Rust' },
  go: { id: 'go', name: 'Go' },
  py: { id: 'python', name: 'Python' },
  pyw: { id: 'python', name: 'Python' },
  java: { id: 'java', name: 'Java' },
  c: { id: 'c', name: 'C' },
  h: { id: 'c', name: 'C Header' },
  cpp: { id: 'cpp', name: 'C++' },
  cc: { id: 'cpp', name: 'C++' },
  cxx: { id: 'cpp', name: 'C++' },
  hpp: { id: 'cpp', name: 'C++ Header' },
  cs: { id: 'csharp', name: 'C#' },
  swift: { id: 'swift', name: 'Swift' },
  kt: { id: 'kotlin', name: 'Kotlin' },
  kts: { id: 'kotlin', name: 'Kotlin' },
  rb: { id: 'ruby', name: 'Ruby' },
  php: { id: 'php', name: 'PHP' },
  lua: { id: 'lua', name: 'Lua' },

  // Web & Styles
  html: { id: 'html', name: 'HTML' },
  htm: { id: 'html', name: 'HTML' },
  css: { id: 'css', name: 'CSS' },
  scss: { id: 'scss', name: 'SCSS' },
  sass: { id: 'sass', name: 'Sass' },
  less: { id: 'less', name: 'Less' },
  vue: { id: 'vue', name: 'Vue' },
  svelte: { id: 'svelte', name: 'Svelte' },

  // Data & Config
  json: { id: 'json', name: 'JSON' },
  yaml: { id: 'yaml', name: 'YAML' },
  yml: { id: 'yaml', name: 'YAML' },
  toml: { id: 'toml', name: 'TOML' },
  xml: { id: 'xml', name: 'XML' },
  svg: { id: 'xml', name: 'SVG' },
  ini: { id: 'ini', name: 'INI' },
  conf: { id: 'ini', name: 'Config' },
  sql: { id: 'sql', name: 'SQL' },
  graphql: { id: 'graphql', name: 'GraphQL' },
  gql: { id: 'graphql', name: 'GraphQL' },

  // Shell & Scripts
  sh: { id: 'bash', name: 'Shell' },
  bash: { id: 'bash', name: 'Bash' },
  zsh: { id: 'bash', name: 'Zsh' },
  ps1: { id: 'powershell', name: 'PowerShell' },
  psm1: { id: 'powershell', name: 'PowerShell' },

  // Docs
  md: { id: 'markdown', name: 'Markdown' },
  markdown: { id: 'markdown', name: 'Markdown' }
}

export const FALLBACK_LANGUAGE: DetectedLanguage = {
  id: 'plaintext',
  name: 'Plain Text'
}

export function detectLanguage(filePath?: string): DetectedLanguage {
  if (!filePath) return FALLBACK_LANGUAGE

  // Normalize path separators and get basename
  const normalized = filePath.replace(/\\/g, '/')
  const segments = normalized.split('/')
  const fileName = segments[segments.length - 1]?.toLowerCase() || ''

  if (!fileName) return FALLBACK_LANGUAGE

  // Check special filenames first
  if (SPECIAL_FILENAMES[fileName]) {
    return SPECIAL_FILENAMES[fileName]
  }

  // Handle dotfiles like .eslintrc.json or standard extensions
  const dotIndex = fileName.lastIndexOf('.')
  if (dotIndex === -1 || dotIndex === 0) {
    // If no dot or hidden file without extension
    return FALLBACK_LANGUAGE
  }

  const ext = fileName.slice(dotIndex + 1)
  if (EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext]
  }

  return FALLBACK_LANGUAGE
}
