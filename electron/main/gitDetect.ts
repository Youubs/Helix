import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function detectGitBinary(): Promise<string | null> {
  try {
    if (process.platform === 'win32') {
      await execAsync('git --version')
    } else {
      await execAsync('git --version')
    }
    return null
  } catch {
    return null
  }
}

export async function isGitAvailable(): Promise<boolean> {
  try {
    await execAsync('git --version')
    return true
  } catch {
    return false
  }
}
