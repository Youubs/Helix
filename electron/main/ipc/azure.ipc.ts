import { IpcMain, BrowserWindow } from 'electron'
import simpleGit from 'simple-git'
import { IPC_CHANNELS } from '../../../src/shared/constants'
import {
  IpcResult,
  AzureProject,
  AzureRepo,
  AzurePullRequest,
  AzureDevOpsIntegration
} from '../../../src/shared/types'
import { getSecureToken, setSecureToken } from './profile.ipc'
import { getStore } from '../store'

// In-memory cache
const cache = new Map<string, { data: unknown; expiresAt: number }>()

function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (entry && Date.now() < entry.expiresAt) return entry.data as T
  cache.delete(key)
  return null
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs })
}

async function azureFetch(orgUrl: string, path: string, pat: string): Promise<Response> {
  const base = orgUrl.replace(/\/$/, '')
  const url = `${base}${path}`
  const auth = Buffer.from(`:${pat}`).toString('base64')
  return fetch(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  })
}

async function azurePost(orgUrl: string, path: string, pat: string, body: unknown): Promise<Response> {
  const base = orgUrl.replace(/\/$/, '')
  const url = `${base}${path}`
  const auth = Buffer.from(`:${pat}`).toString('base64')
  return fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

function getIntegration(profileId: string, integrationId: string): AzureDevOpsIntegration | null {
  const store = getStore()
  const profiles = store.get('profiles')
  const profile = profiles.find((p) => p.id === profileId)
  if (!profile) return null
  return profile.integrations.azureDevOps?.find((i) => i.id === integrationId) || null
}

export function registerAzureHandlers(ipcMain: IpcMain) {
  ipcMain.handle(
    IPC_CHANNELS.AZURE_VALIDATE_PAT,
    async (_event, args: {
      orgUrl: string
      pat: string
      profileId: string
      integrationId: string
    }): Promise<IpcResult<{ projects: AzureProject[] }>> => {
      try {
        const { orgUrl, pat, profileId, integrationId } = args
        const resp = await azureFetch(orgUrl, '/_apis/projects?api-version=7.1', pat)

        if (resp.status === 401) {
          return { ok: false, error: 'Token invalide ou expiré' }
        }
        if (resp.status === 403) {
          return { ok: false, error: 'Token valide mais scopes insuffisants — vérifiez les permissions Code (Read)' }
        }
        if (!resp.ok) {
          return { ok: false, error: `Impossible de joindre Azure DevOps (HTTP ${resp.status})` }
        }

        const data = await resp.json() as { value: AzureProject[] }

        // Store the PAT securely
        await setSecureToken(profileId, `azure:${integrationId}`, pat)

        return { ok: true, data: { projects: data.value } }
      } catch (e: any) {
        if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
          return { ok: false, error: "Impossible de joindre Azure DevOps — vérifiez l'URL de l'organisation" }
        }
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_LIST_PROJECTS,
    async (_event, args: { profileId: string; integrationId: string }): Promise<IpcResult<AzureProject[]>> => {
      try {
        const { profileId, integrationId } = args
        const cacheKey = `projects:${profileId}:${integrationId}`
        const cached = getCached<AzureProject[]>(cacheKey)
        if (cached) return { ok: true, data: cached }

        const integration = getIntegration(profileId, integrationId)
        if (!integration) return { ok: false, error: 'Integration not found' }

        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No stored token — re-authenticate' }

        const resp = await azureFetch(integration.organizationUrl, '/_apis/projects?api-version=7.1', pat)
        if (!resp.ok) return { ok: false, error: `Azure API error (HTTP ${resp.status})` }

        const data = await resp.json() as { value: AzureProject[] }
        setCache(cacheKey, data.value, 10 * 60 * 1000)
        return { ok: true, data: data.value }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_LIST_REPOS,
    async (_event, args: { profileId: string; integrationId: string; project: string }): Promise<IpcResult<AzureRepo[]>> => {
      try {
        const { profileId, integrationId, project } = args
        const cacheKey = `repos:${profileId}:${integrationId}:${project}`
        const cached = getCached<AzureRepo[]>(cacheKey)
        if (cached) return { ok: true, data: cached }

        const integration = getIntegration(profileId, integrationId)
        if (!integration) return { ok: false, error: 'Integration not found' }

        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No stored token — re-authenticate' }

        const resp = await azureFetch(
          integration.organizationUrl,
          `/${encodeURIComponent(project)}/_apis/git/repositories?api-version=7.1`,
          pat
        )
        if (!resp.ok) return { ok: false, error: `Azure API error (HTTP ${resp.status})` }

        const data = await resp.json() as { value: any[] }
        const repos: AzureRepo[] = data.value.map((r) => ({
          id: r.id,
          name: r.name,
          project: r.project?.name || project,
          remoteUrl: r.remoteUrl,
          defaultBranch: r.defaultBranch,
          size: r.size || 0
        }))
        setCache(cacheKey, repos, 5 * 60 * 1000)
        return { ok: true, data: repos }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_LIST_PRS,
    async (_event, args: {
      profileId: string
      integrationId: string
      project: string
      repoId: string
      status?: string
    }): Promise<IpcResult<AzurePullRequest[]>> => {
      try {
        const { profileId, integrationId, project, repoId, status } = args
        const integration = getIntegration(profileId, integrationId)
        if (!integration) return { ok: false, error: 'Integration not found' }

        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No stored token — re-authenticate' }

        let path = `/${encodeURIComponent(project)}/_apis/git/repositories/${repoId}/pullrequests?api-version=7.1`
        if (status) path += `&searchCriteria.status=${status}`

        const resp = await azureFetch(integration.organizationUrl, path, pat)
        if (!resp.ok) return { ok: false, error: `Azure API error (HTTP ${resp.status})` }

        const data = await resp.json() as { value: any[] }
        const prs: AzurePullRequest[] = data.value.map((pr) => ({
          id: pr.pullRequestId,
          title: pr.title,
          description: pr.description,
          status: pr.status,
          createdBy: {
            displayName: pr.createdBy?.displayName || '',
            uniqueName: pr.createdBy?.uniqueName || ''
          },
          creationDate: pr.creationDate,
          sourceRefName: pr.sourceRefName,
          targetRefName: pr.targetRefName,
          reviewers: (pr.reviewers || []).map((r: any) => ({
            displayName: r.displayName,
            uniqueName: r.uniqueName,
            vote: r.vote,
            isRequired: r.isRequired || false
          })),
          url: pr.url,
          isDraft: pr.isDraft || false,
          mergeStatus: pr.mergeStatus || 'notSet'
        }))
        return { ok: true, data: prs }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_CREATE_PR,
    async (_event, args: {
      profileId: string
      integrationId: string
      project: string
      repoId: string
      title: string
      description?: string
      sourceRefName: string
      targetRefName: string
      isDraft?: boolean
      reviewers?: string[]
    }): Promise<IpcResult<AzurePullRequest>> => {
      try {
        const { profileId, integrationId, project, repoId, ...payload } = args
        const integration = getIntegration(profileId, integrationId)
        if (!integration) return { ok: false, error: 'Integration not found' }

        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No stored token — re-authenticate' }

        const body: any = {
          title: payload.title,
          description: payload.description || '',
          sourceRefName: payload.sourceRefName,
          targetRefName: payload.targetRefName,
          isDraft: payload.isDraft || false
        }
        if (payload.reviewers?.length) {
          body.reviewers = payload.reviewers.map((r) => ({ uniqueName: r }))
        }

        const resp = await azurePost(
          integration.organizationUrl,
          `/${encodeURIComponent(project)}/_apis/git/repositories/${repoId}/pullrequests?api-version=7.1`,
          pat,
          body
        )
        if (!resp.ok) {
          const err = await resp.text()
          return { ok: false, error: `Failed to create PR (${resp.status}): ${err}` }
        }

        const pr = await resp.json() as any
        return {
          ok: true,
          data: {
            id: pr.pullRequestId,
            title: pr.title,
            description: pr.description,
            status: pr.status,
            createdBy: {
              displayName: pr.createdBy?.displayName || '',
              uniqueName: pr.createdBy?.uniqueName || ''
            },
            creationDate: pr.creationDate,
            sourceRefName: pr.sourceRefName,
            targetRefName: pr.targetRefName,
            reviewers: [],
            url: pr.url,
            isDraft: pr.isDraft || false,
            mergeStatus: pr.mergeStatus || 'notSet'
          }
        }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_CLONE_REPO,
    async (_event, args: {
      profileId: string
      integrationId: string
      remoteUrl: string
      destPath: string
    }): Promise<IpcResult<boolean>> => {
      try {
        const { profileId, integrationId, remoteUrl, destPath } = args
        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No stored token — re-authenticate' }

        // Inject PAT into URL in-memory only
        const authUrl = remoteUrl.replace('https://', `https://pat:${pat}@`)
        const git = simpleGit()
        await git.clone(authUrl, destPath)

        // After clone, reset remote to non-PAT URL
        const repoGit = simpleGit({ baseDir: destPath })
        await repoGit.remote(['set-url', 'origin', remoteUrl])

        return { ok: true, data: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.AZURE_CHECK_TOKEN,
    async (_event, args: { profileId: string; integrationId: string }): Promise<IpcResult<boolean>> => {
      try {
        const { profileId, integrationId } = args
        const integration = getIntegration(profileId, integrationId)
        if (!integration) return { ok: false, error: 'Integration not found' }

        const pat = await getSecureToken(profileId, `azure:${integrationId}`)
        if (!pat) return { ok: false, error: 'No token stored' }

        const resp = await azureFetch(integration.organizationUrl, '/_apis/connectionData', pat)
        if (resp.status === 401) {
          // Notify renderer about expiration
          const windows = BrowserWindow.getAllWindows()
          windows.forEach((w) => {
            w.webContents.send(IPC_CHANNELS.AZURE_TOKEN_EXPIRED, {
              profileId,
              integrationId,
              orgLabel: integration.label
            })
          })
          return { ok: false, error: 'Token expired' }
        }
        return { ok: true, data: true }
      } catch (e: any) {
        return { ok: false, error: e.message }
      }
    }
  )
}
