import { IpcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import simpleGit, { SimpleGit } from 'simple-git'
import { IPC_CHANNELS } from '../../../src/shared/constants'
import {
  IpcResult,
  CommitNode,
  RefInfo,
  BranchInfo,
  StatusResult,
  FileStatus,
  DiffFile,
  DiffHunk,
  DiffLine,
  TagInfo,
  StashEntry,
  RemoteInfo,
  BlameResult,
  LogOptions,
  CommitOptions,
  PullOptions,
  PushOptions,
  ResetOptions
} from '../../../src/shared/types'
import { initWatcher, stopWatcher } from '../watcher'
import { getMainWindow } from '../index'

let git: SimpleGit | null = null
let currentRepoPath: string | null = null

function ok<T>(data: T): IpcResult<T> {
  return { ok: true, data }
}

function err<T>(error: string): IpcResult<T> {
  return { ok: false, error }
}

async function getGit(repoPath?: string): Promise<SimpleGit> {
  if (repoPath && repoPath !== currentRepoPath) {
    git = simpleGit({
      baseDir: repoPath,
      maxConcurrentProcesses: 6
    })
    currentRepoPath = repoPath

    stopWatcher()
    const win = getMainWindow()
    if (win) {
      initWatcher(repoPath, win)
    }
  }
  if (!git) throw new Error('No repository open')
  return git
}

function parseRefs(refString: string): RefInfo[] {
  if (!refString) return []
  const result: RefInfo[] = []
  const parts = refString.split(',')
  for (const p of parts) {
    const ref = p.trim()
    if (!ref) continue
    if (
      ref.startsWith('refs/jj/') ||
      ref.startsWith('refs/notes/') ||
      ref.startsWith('refs/replace/') ||
      ref.startsWith('refs/original/')
    ) {
      continue
    }
    if (ref.includes('->')) {
      const [head, target] = ref.split('->').map((s) => s.trim())
      if (head === 'HEAD') {
        result.push({ name: 'HEAD', type: 'head' as const })
      }
      if (target) {
        result.push({
          name: target,
          type: target.includes('/') ? ('remote-branch' as const) : ('local-branch' as const)
        })
      }
    } else if (ref === 'HEAD') {
      result.push({ name: 'HEAD', type: 'head' as const })
    } else if (ref.startsWith('tag: ')) {
      result.push({ name: ref.replace('tag: ', ''), type: 'tag' as const })
    } else if (ref.includes('/')) {
      result.push({ name: ref, type: 'remote-branch' as const })
    } else {
      result.push({ name: ref, type: 'local-branch' as const })
    }
  }
  return result
}

export async function openGitRepo(repoPath: string): Promise<IpcResult<boolean>> {
  try {
    const g = simpleGit({ baseDir: repoPath })
    const isRepo = await g.checkIsRepo()
    if (!isRepo) return err('Not a Git repository')
    await getGit(repoPath)
    return ok(true)
  } catch (e: any) {
    return err(e.message)
  }
}

export function registerGitHandlers(ipcMain: IpcMain) {
  ipcMain.handle(
    IPC_CHANNELS.GIT_OPEN,
    async (_event, repoPath: string): Promise<IpcResult<boolean>> => {
      try {
        const g = simpleGit({ baseDir: repoPath })
        const isRepo = await g.checkIsRepo()
        if (!isRepo) return err('Not a Git repository')
        await getGit(repoPath)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_LOG,
    async (_event, opts: LogOptions = {}): Promise<IpcResult<CommitNode[]>> => {
      try {
        const g = await getGit()
        const args = [
          '--format=%H%x1f%h%x1f%P%x1f%s%x1f%b%x1f%an%x1f%ae%x1f%ci%x1f%D%x1e',
          '--date=iso'
        ]
        if (opts.all !== false) {
          args.push('--branches', '--tags', '--remotes')
        }
        args.push('--exclude=refs/jj/*')
        if (opts.maxCount) args.push(`--max-count=${opts.maxCount}`)
        if (opts.from) args.push(opts.from)
        if (opts.file) args.push('--', opts.file)

        let raw = ''
        try {
          raw = await g.raw(['log', ...args])
        } catch (logErr: any) {
          if (
            logErr.message &&
            (logErr.message.includes('does not have any commits yet') ||
              logErr.message.includes('bad default revision') ||
              logErr.message.includes('unknown revision'))
          ) {
            return ok([])
          }
          throw logErr
        }

        const commits: CommitNode[] = []
        const entries = raw.split('\x1e').filter((e) => e.trim().length > 0)

        for (const entry of entries) {
          const parts = entry.split('\x1f')
          if (parts.length < 8) continue
          const [hash, abbreviatedHash, parentsStr, message, body, authorName, authorEmail, authorDate, refsStr = ''] = parts
          commits.push({
            hash: hash.trim(),
            abbreviatedHash: abbreviatedHash.trim(),
            parents: parentsStr.trim() ? parentsStr.trim().split(' ') : [],
            message: message.trim(),
            body: body.trim(),
            authorName: authorName.trim(),
            authorEmail: authorEmail.trim(),
            authorDate: authorDate.trim(),
            refs: parseRefs(refsStr.trim())
          })
        }
        return ok(commits)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STATUS,
    async (): Promise<IpcResult<StatusResult>> => {
      try {
        const g = await getGit()
        const status = await g.status()
        const staged: FileStatus[] = []
        const unstaged: FileStatus[] = []

        for (const f of status.files) {
          if (f.index && f.index !== ' ' && f.index !== '?') {
            staged.push({
              path: f.path,
              index: f.index,
              working_dir: f.working_dir || ' ',
              isStaged: true
            })
          }
          if (f.working_dir && f.working_dir !== ' ' && f.working_dir !== '?') {
            unstaged.push({
              path: f.path,
              index: f.index || ' ',
              working_dir: f.working_dir,
              isStaged: false
            })
          }
        }

        return ok({
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          staged,
          unstaged,
          untracked: status.not_added,
          conflicted: status.conflicted
        })
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STAGE,
    async (_event, files: string[]): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.add(files)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_UNSTAGE,
    async (_event, files: string[]): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.reset(['HEAD', '--', ...files])
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_COMMIT,
    async (
      _event,
      message: string,
      opts?: CommitOptions
    ): Promise<IpcResult<string>> => {
      try {
        const g = await getGit()
        const args: string[] = []
        if (opts?.amend) args.push('--amend')
        let fullMessage = message
        if (opts?.coAuthors?.length) {
          fullMessage += '\n\n' + opts.coAuthors.map((a) => `Co-authored-by: ${a}`).join('\n')
        }
        const result = await g.commit(fullMessage, undefined, Object.fromEntries(args.map(a => [a, null])))
        return ok(result.commit)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_BRANCHES,
    async (): Promise<IpcResult<BranchInfo[]>> => {
      try {
        const g = await getGit()
        const summary = await g.branch(['-a', '-v'])
        const branches: BranchInfo[] = Object.values(summary.branches).map((b) => ({
          name: b.name,
          current: b.current,
          commit: b.commit,
          remote: b.name.startsWith('remotes/') ? b.name.split('/')[1] : undefined,
          tracking: b.label
        }))
        return ok(branches)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_BRANCH_DELETE,
    async (_event, branch: string, force: boolean = false): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.deleteLocalBranch(branch, force)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_CHECKOUT,
    async (_event, ref: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.checkout(ref)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF,
    async (
      _event,
      file: string,
      staged: boolean = false
    ): Promise<IpcResult<string>> => {
      try {
        const g = await getGit()
        const args = staged ? ['--cached', '--', file] : ['--', file]
        let diff = await g.diff(args)

        if (!diff && !staged && currentRepoPath) {
          const fullPath = path.join(currentRepoPath, file)
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const lines = content.split('\n')
            const diffHeader = `--- /dev/null\n+++ b/${file}\n@@ -0,0 +1,${lines.length} @@\n`
            diff = diffHeader + lines.map((l) => `+${l}`).join('\n')
          }
        }

        return ok(diff)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_DIFF_COMMIT,
    async (_event, hash: string): Promise<IpcResult<string>> => {
      try {
        const g = await getGit()
        const diff = await g.show([hash, '--format=', '--patch', '-m'])
        return ok(diff)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_PULL,
    async (_event, opts?: PullOptions): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args: string[] = []
        if (opts?.rebase) args.push('--rebase')
        if (opts?.ffOnly) args.push('--ff-only')
        const remote = opts?.remote || 'origin'
        const branch = opts?.branch || ''
        await g.pull(remote, branch, args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_PUSH,
    async (_event, opts?: PushOptions): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const remote = opts?.remote || 'origin'
        let branch = opts?.branch
        if (!branch) {
          const status = await g.status()
          branch = status.current || undefined
        }

        const args: string[] = []
        if (opts?.setUpstream) args.push('--set-upstream')
        if (opts?.force) args.push('--force-with-lease')

        if (branch) {
          await g.push(remote, branch, args)
        } else {
          await g.push(remote, undefined, args)
        }
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_FETCH,
    async (_event, remote?: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        if (remote) {
          await g.fetch(remote, ['--prune'])
        } else {
          await g.fetch(['--all', '--prune'])
        }
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_MERGE,
    async (_event, branch: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.merge([branch])
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_REBASE,
    async (_event, branch: string, opts?: { abort?: boolean; continue_?: boolean }): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        if (opts?.abort) {
          await g.rebase(['--abort'])
        } else if (opts?.continue_) {
          await g.rebase(['--continue'])
        } else {
          await g.rebase([branch])
        }
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_CHERRY_PICK,
    async (_event, hash: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.raw(['cherry-pick', hash])
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STASH_LIST,
    async (): Promise<IpcResult<StashEntry[]>> => {
      try {
        const g = await getGit()
        const list = await g.stashList()
        const entries: StashEntry[] = list.all.map((s, i) => ({
          index: i,
          message: s.message,
          date: s.date
        }))
        return ok(entries)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STASH_PUSH,
    async (_event, message?: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args = message ? ['push', '-m', message] : ['push']
        await g.stash(args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STASH_POP,
    async (_event, index?: number): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args = index !== undefined ? ['pop', `stash@{${index}}`] : ['pop']
        await g.stash(args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STASH_APPLY,
    async (_event, index?: number): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args = index !== undefined ? ['apply', `stash@{${index}}`] : ['apply']
        await g.stash(args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_STASH_DROP,
    async (_event, index?: number): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args = index !== undefined ? ['drop', `stash@{${index}}`] : ['drop']
        await g.stash(args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_RESET,
    async (_event, opts: ResetOptions): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.reset([`--${opts.mode}`, opts.ref])
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_REVERT,
    async (_event, hash: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.revert(hash)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_TAG_LIST,
    async (): Promise<IpcResult<TagInfo[]>> => {
      try {
        const g = await getGit()
        const tags = await g.tags()
        const result: TagInfo[] = tags.all.map((t) => ({
          name: t,
          commit: ''
        }))
        return ok(result)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_TAG_CREATE,
    async (
      _event,
      name: string,
      ref?: string,
      message?: string
    ): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        const args = message ? ['-a', name, '-m', message] : [name]
        if (ref) args.push(ref)
        await g.tag(args)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_TAG_DELETE,
    async (_event, name: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.tag(['-d', name])
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_TAG_PUSH,
    async (_event, name: string, remote?: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.push(remote || 'origin', name)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_BLAME,
    async (_event, file: string): Promise<IpcResult<BlameResult>> => {
      try {
        const g = await getGit()
        const raw = await g.raw(['blame', '--porcelain', file])
        const lines: BlameResult['lines'] = []
        const rawLines = raw.split('\n')
        let currentHash = ''
        let currentAuthor = ''
        let currentDate = ''
        let lineNum = 0

        for (const line of rawLines) {
          if (line.match(/^[0-9a-f]{40}/)) {
            const parts = line.split(' ')
            currentHash = parts[0]
            lineNum = parseInt(parts[2], 10)
          } else if (line.startsWith('author ')) {
            currentAuthor = line.slice(7)
          } else if (line.startsWith('author-time ')) {
            currentDate = new Date(parseInt(line.slice(12), 10) * 1000).toISOString()
          } else if (line.startsWith('\t')) {
            lines.push({
              hash: currentHash,
              author: currentAuthor,
              date: currentDate,
              lineNumber: lineNum,
              content: line.slice(1)
            })
          }
        }
        return ok({ lines })
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_REMOTE_LIST,
    async (): Promise<IpcResult<RemoteInfo[]>> => {
      try {
        const g = await getGit()
        const remotes = await g.getRemotes(true)
        return ok(
          remotes.map((r) => ({
            name: r.name,
            fetchUrl: r.refs.fetch || '',
            pushUrl: r.refs.push || ''
          }))
        )
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_REMOTE_ADD,
    async (_event, name: string, url: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.addRemote(name, url)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_REMOTE_REMOVE,
    async (_event, name: string): Promise<IpcResult<boolean>> => {
      try {
        const g = await getGit()
        await g.removeRemote(name)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_CLONE,
    async (_event, url: string, localPath: string): Promise<IpcResult<boolean>> => {
      try {
        await simpleGit().clone(url, localPath)
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.GIT_INIT,
    async (_event, localPath: string): Promise<IpcResult<boolean>> => {
      try {
        await simpleGit({ baseDir: localPath }).init()
        return ok(true)
      } catch (e: any) {
        return err(e.message)
      }
    }
  )
}
