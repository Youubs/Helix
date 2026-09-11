import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import os from 'os'

const execAsync = promisify(exec)

export async function detectSSH(): Promise<boolean> {
  const sshDir = path.join(os.homedir(), '.ssh')

  if (!fs.existsSync(sshDir)) return false

  const keyFiles = ['id_rsa', 'id_ed25519', 'id_ecdsa', 'id_dsa']
  const hasKey = keyFiles.some((key) =>
    fs.existsSync(path.join(sshDir, key))
  )

  if (!hasKey) return false

  if (process.platform === 'win32') {
    try {
      await execAsync('where ssh')
      return true
    } catch {
      try {
        await execAsync('where pageant')
        return true
      } catch {
        return false
      }
    }
  }

  try {
    await execAsync('which ssh')
    return true
  } catch {
    return false
  }
}
