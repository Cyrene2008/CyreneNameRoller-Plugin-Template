import fs from 'node:fs/promises'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'
import { stagePlugin } from './stage-plugin.mjs'

const root = path.resolve(import.meta.dirname, '..')
const cliPath = path.join(root, 'node_modules', '@starcyrene', 'cyrene-name-roller', 'bin', 'cnrp.mjs')
const output = path.join(root, 'dist', 'cyrene-plugin-template.cnrp')

// The release version comes from manifest.yml through the same reader the CLI uses.
const { readManifestSource } = await import(pathToFileURL(cliPath).href)
const { raw } = await readManifestSource(root)

await fs.mkdir(path.dirname(output), { recursive: true })

// Pack the staged copy, not the repository root: the published package must not carry
// development tooling (scripts/, CI workflows, test/, docs/, lockfile, vendor SDK).
const { stage, cleanup } = await stagePlugin()

try {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliPath, 'pack', stage, '--out', output], { stdio: 'inherit', shell: false })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`cnrp pack exited with ${code}`)))
  })
} finally {
  await cleanup()
}

console.log(`Template version ${raw.version} -> ${output}`)
