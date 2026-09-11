/**
 * Extracts the branch short name from a remote branch ref name,
 * using the known list of remote names to determine the exact prefix to strip.
 *
 * For "origin/feat/akr/magic-link-teams" with remotes=["origin"]:
 *   → "feat/akr/magic-link-teams"
 *
 * Without this, a naive regex like /^[^/]+\// would strip "feat/" from
 * "feat/akr/magic-link-teams" if it were mistakenly treated as a remote ref.
 */
export function stripRemotePrefix(
  refName: string,
  remoteNames: string[]
): { shortName: string; remoteName: string | null } {
  const cleaned = refName.replace(/^remotes\//, '')

  // Sort by length descending so "upstream" matches before "up"
  const sorted = [...remoteNames].sort((a, b) => b.length - a.length)

  for (const remote of sorted) {
    const prefix = remote + '/'
    if (cleaned.startsWith(prefix)) {
      return {
        shortName: cleaned.slice(prefix.length),
        remoteName: remote,
      }
    }
  }

  // No known remote matched — fall back to stripping first segment
  // (best effort for unknown remotes)
  const slashIdx = cleaned.indexOf('/')
  if (slashIdx > 0) {
    return {
      shortName: cleaned.slice(slashIdx + 1),
      remoteName: cleaned.slice(0, slashIdx),
    }
  }

  return { shortName: cleaned, remoteName: null }
}
