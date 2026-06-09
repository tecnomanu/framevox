import { printStatus } from '../install-status.js'
import { cmdUpdate } from './update.js'

export async function cmdStatus() {
  const action = await printStatus({ interactive: true })
  if (action === 'update') {
    cmdUpdate({})
  }
}
