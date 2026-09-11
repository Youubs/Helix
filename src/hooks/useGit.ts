import { useCallback, useMemo } from 'react'
import { useGitStore } from '@/stores/gitStore'
import { useRepoStore } from '@/stores/repoStore'
import { toast } from 'sonner'
import type { CommitOptions, PullOptions, PushOptions, ResetOptions } from '@/shared/types'

export function useGit() {
  const refresh = useGitStore((s) => s.refresh)
  const addTab = useRepoStore((s) => s.addTab)
  const addRecentRepo = useRepoStore((s) => s.addRecentRepo)
  const setActiveTab = useRepoStore((s) => s.setActiveTab)
  const tabs = useRepoStore((s) => s.tabs)
  const activeTabId = useRepoStore((s) => s.activeTabId)

  const openRepo = useCallback(async (path?: string) => {
    let repoPath = path
    if (!repoPath) {
      const result = await window.fsAPI.openDialog()
      if (!result.ok || !result.data) return
      repoPath = result.data
    }
    const openResult = await window.gitAPI.openRepository(repoPath)
    if (!openResult.ok) {
      toast.error(openResult.error)
      return
    }
    const name = repoPath.split(/[/\\]/).pop() || repoPath
    addTab(repoPath, name)
    addRecentRepo({ path: repoPath, name, lastOpened: Date.now(), pinned: false })
    await refresh()
  }, [refresh, addTab, addRecentRepo])

  const stage = useCallback(async (files: string[]) => {
    const result = await window.gitAPI.stage(files)
    if (!result.ok) toast.error(result.error)
    else await refresh()
  }, [refresh])

  const unstage = useCallback(async (files: string[]) => {
    const result = await window.gitAPI.unstage(files)
    if (!result.ok) toast.error(result.error)
    else await refresh()
  }, [refresh])

  const commit = useCallback(async (message: string, opts?: CommitOptions) => {
    const result = await window.gitAPI.commit(message, opts)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Commit created')
      await refresh()
    }
    return result
  }, [refresh])

  const checkout = useCallback(async (ref: string) => {
    const result = await window.gitAPI.checkout(ref)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Checked out ${ref}`)
      await refresh()
    }
  }, [refresh])

  const remotes = useGitStore((s) => s.remotes)

  const pull = useCallback(async (opts?: PullOptions) => {
    if (remotes.length === 0) {
      toast.error('No remote configured. Click "Remotes" in the toolbar to add origin.')
      return
    }
    const result = await window.gitAPI.pull(opts)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Pull complete')
      await refresh()
    }
  }, [refresh, remotes.length])

  const push = useCallback(async (opts?: PushOptions) => {
    if (remotes.length === 0) {
      toast.error('No remote configured. Click "Remotes" in the toolbar to add origin.')
      return { ok: false, error: 'No remote configured' }
    }
    const result = await window.gitAPI.push(opts)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Push complete')
      await refresh()
    }
    return result
  }, [refresh, remotes.length])

  const fetchAll = useCallback(async () => {
    if (remotes.length === 0) {
      toast.error('No remote configured. Click "Remotes" in the toolbar to add origin.')
      return
    }
    const result = await window.gitAPI.fetch()
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Fetch complete')
      await refresh()
    }
  }, [refresh, remotes.length])

  const merge = useCallback(async (branch: string) => {
    const result = await window.gitAPI.merge(branch)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Merged ${branch}`)
      await refresh()
    }
  }, [refresh])

  const rebase = useCallback(async (branch: string) => {
    const result = await window.gitAPI.rebase(branch)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Rebased onto ${branch}`)
      await refresh()
    }
  }, [refresh])

  const cherryPick = useCallback(async (hash: string) => {
    const result = await window.gitAPI.cherryPick(hash)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Cherry-pick applied')
      await refresh()
    }
  }, [refresh])

  const stashPush = useCallback(async (message?: string) => {
    const result = await window.gitAPI.stashPush(message)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Changes stashed')
      await refresh()
    }
  }, [refresh])

  const stashPop = useCallback(async (index?: number) => {
    const result = await window.gitAPI.stashPop(index)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Stash popped')
      await refresh()
    }
  }, [refresh])

  const reset = useCallback(async (opts: ResetOptions) => {
    const result = await window.gitAPI.reset(opts)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Reset ${opts.mode} to ${opts.ref.slice(0, 7)}`)
      await refresh()
    }
  }, [refresh])

  const revert = useCallback(async (hash: string) => {
    const result = await window.gitAPI.revert(hash)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Commit reverted')
      await refresh()
    }
  }, [refresh])

  const createTag = useCallback(async (name: string, ref?: string, message?: string) => {
    const result = await window.gitAPI.createTag(name, ref, message)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Tag '${name}' created`)
      await refresh()
    }
  }, [refresh])

  const deleteTag = useCallback(async (name: string) => {
    const result = await window.gitAPI.deleteTag(name)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Tag '${name}' deleted`)
      await refresh()
    }
  }, [refresh])

  const deleteBranch = useCallback(async (branch: string, force?: boolean) => {
    const result = await window.gitAPI.deleteBranch(branch, force)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Branch '${branch}' deleted`)
      await refresh()
    }
  }, [refresh])

  const pushTag = useCallback(async (name: string, remote?: string) => {
    const result = await window.gitAPI.pushTag(name, remote)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success(`Tag '${name}' pushed`)
      await refresh()
    }
  }, [refresh])

  const stashApply = useCallback(async (index?: number) => {
    const result = await window.gitAPI.stashApply(index)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Stash applied')
      await refresh()
    }
  }, [refresh])

  const stashDrop = useCallback(async (index?: number) => {
    const result = await window.gitAPI.stashDrop(index)
    if (!result.ok) toast.error(result.error)
    else {
      toast.success('Stash dropped')
      await refresh()
    }
  }, [refresh])

  const cloneRepo = useCallback(async (url: string, localPath: string) => {
    const result = await window.gitAPI.clone(url, localPath)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    toast.success('Repository cloned')
    await openRepo(localPath)
    return true
  }, [openRepo])

  const initRepo = useCallback(async (localPath: string) => {
    const result = await window.gitAPI.init(localPath)
    if (!result.ok) {
      toast.error(result.error)
      return false
    }
    toast.success('Repository initialized')
    await openRepo(localPath)
    return true
  }, [openRepo])

  const switchTab = useCallback(async (tabId: string) => {
    if (tabId === activeTabId) return
    const tab = tabs.find((t) => t.id === tabId)
    if (!tab) return
    setActiveTab(tabId)
    const openResult = await window.gitAPI.openRepository(tab.path)
    if (openResult.ok) {
      await refresh()
    } else {
      toast.error(openResult.error)
    }
  }, [activeTabId, tabs, setActiveTab, refresh])

  return useMemo(() => ({
    openRepo,
    switchTab,
    stage,
    unstage,
    commit,
    checkout,
    deleteBranch,
    pull,
    push,
    fetchAll,
    merge,
    rebase,
    cherryPick,
    stashPush,
    stashPop,
    stashApply,
    stashDrop,
    reset,
    revert,
    createTag,
    deleteTag,
    pushTag,
    cloneRepo,
    initRepo
  }), [
    openRepo, switchTab, stage, unstage, commit, checkout, deleteBranch,
    pull, push, fetchAll, merge, rebase, cherryPick,
    stashPush, stashPop, stashApply, stashDrop, reset, revert, createTag, deleteTag, pushTag,
    cloneRepo, initRepo
  ])
}
