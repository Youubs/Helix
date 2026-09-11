import ElectronStore from 'electron-store'
import { HelixProfile } from '../../src/shared/types'
import { v4 as uuidv4 } from 'uuid'

interface StoreSchema {
  activeProfileId: string | null
  profiles: HelixProfile[]
  windowBounds: { x: number; y: number; width: number; height: number } | null
}

let store: ElectronStore<StoreSchema>

export function initStore() {
  store = new ElectronStore<StoreSchema>({
    defaults: {
      activeProfileId: null,
      profiles: [],
      windowBounds: null
    },
    beforeEachMigration: (_store, context) => {
      console.log(`Migrating store from ${context.fromVersion} → ${context.toVersion}`)
    },
    migrations: {
      '1.0.0': (s) => {
        const oldRepos = (s as any).get('recentRepos', [])
        const oldTheme = (s as any).get('theme', 'dark')
        const oldIdentity = (s as any).get('gitIdentity', null)
        const oldSsh = (s as any).get('sshKeyPath', null)

        if (oldRepos.length > 0 || oldIdentity) {
          const id = uuidv4()
          const profile: HelixProfile = {
            id,
            name: 'Default',
            avatar: { type: 'initials', color: '#00d0a3' },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            git: {
              userName: oldIdentity?.name || '',
              userEmail: oldIdentity?.email || '',
              sshKeyPath: oldSsh || undefined
            },
            preferences: {
              theme: oldTheme,
              defaultBranch: 'main',
              fetchOnStartup: true,
              autofetchInterval: 5,
              showAuthorAvatars: false,
              commitGraphDensity: 'compact',
              diffFont: 'JetBrains Mono',
              diffTabSize: 4,
              language: 'en'
            },
            projects: oldRepos.map((r: any) => ({
              id: uuidv4(),
              path: r.path,
              name: r.name,
              isPinned: r.pinned || false,
              lastOpenedAt: new Date(r.lastOpened || Date.now()).toISOString()
            })),
            integrations: {}
          }
          s.set('profiles', [profile])
          s.set('activeProfileId', id)

          ;(s as any).delete('recentRepos')
          ;(s as any).delete('theme')
          ;(s as any).delete('gitIdentity')
          ;(s as any).delete('sshKeyPath')
        }
      }
    }
  })
}

export function getStore(): ElectronStore<StoreSchema> {
  return store
}
