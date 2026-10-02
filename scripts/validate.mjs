import path from 'node:path'
import { spawn } from 'node:child_process'
import { stagePlugin } from './stage-plugin.mjs'

const root = path.resolve(import.meta.dirname, '..')
const cliPath = path.join(root, 'node_modules', '@starcyrene', 'cyrene-name-roller', 'bin', 'cnrp.mjs')

// Validate the staged copy, not the repository root, so the check covers exactly the files
// that ship in the .cnrp.
const { stage, cleanup } = await stagePlugin()

try {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, 'validate', stage], { stdio: 'inherit', shell: false })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`cnrp validate exited with ${code}`)))
  })
} finally {
  await cleanup()
}
