import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { pathToFileURL } from 'node:url'
import { stagePlugin } from '../scripts/stage-plugin.mjs'

const root = path.resolve(import.meta.dirname, '..')
const vendoredCli = path.join(root, 'node_modules', '@starcyrene', 'cyrene-name-roller', 'bin', 'cnrp.mjs')

async function loadVendoredCli() {
  try {
    await fs.access(vendoredCli)
  } catch {
    throw new Error(`The vendored API 1.4 SDK is not installed. Run "bun install" before "npm test" (missing ${vendoredCli}).`)
  }
  return import(pathToFileURL(vendoredCli).href)
}

test('the enabled declaration is the split manifest.yml + contributions.json pair', async () => {
  const files = new Set(await fs.readdir(root))
  assert.equal(files.has('manifest.yml'), true, 'manifest.yml is the enabled identity declaration')
  assert.equal(files.has('contributions.json'), true, 'contributions.json holds every contribution')
  assert.equal(files.has('manifest.json'), false, 'a stray root manifest.json would be read by the CLI')
  assert.equal(files.has('manifest.api15.json'), true, 'API 1.5 material is kept but not enabled')

  const contributions = JSON.parse(await fs.readFile(path.join(root, 'contributions.json'), 'utf8'))
  assert.equal(Array.isArray(contributions), false)
  assert.equal(Object.hasOwn(contributions, 'contributes'), false)
  for (const identityKey of ['id', 'name', 'version', 'author', 'engine', 'entry', 'permissions', 'icon', 'readme']) {
    assert.equal(Object.hasOwn(contributions, identityKey), false, `contributions.json must not declare ${identityKey}`)
  }

  // The split format is for API 1.2-1.4 plugins: page settings live in the top-level
  // `settings` key, never in pages[].native.
  for (const page of contributions.pages || []) {
    assert.equal(page.native, undefined, `split-format page ${page.id} must not declare native settings`)
    assert.ok(page.entry, `split-format page ${page.id} needs an iframe entry`)
  }

  // Every customizable surface the template documents has to be declared by the example payload.
  assert.equal(contributions.settings.sections.length, 2)
  const fieldTypes = new Set(contributions.settings.sections.flatMap(section => section.fields.map(field => field.type)))
  for (const type of [
    'toggle', 'slider', 'select', 'audio',
    'animation-select', 'component-style-select', 'component-override-select',
    'component-override-toggle', 'result-presentation-select'
  ]) {
    assert.equal(fieldTypes.has(type), true, `settings should demonstrate the ${type} field`)
  }
  assert.equal(contributions.componentStylePacks.length, 3)
  assert.equal(contributions.componentOverridePacks.length, 3)
  assert.equal(contributions.nativeViews.length, 3)
  assert.equal(contributions.resultPresentations.length, 4)
  assert.equal(contributions.animationPacks.length, 1)
  assert.equal(contributions.visualSurfaces.length, 1)
  assert.equal(contributions.commands.length, 4)
})

test('the example worker only uses API 1.4 SDK entry points', async () => {
  const worker = await fs.readFile(path.join(root, 'src', 'worker.js'), 'utf8')
  assert.match(worker, /from '@starcyrene\/cyrene-name-roller\/plugin-sdk'/)
  for (const helper of ['describeHost', 'executeDraw', 'queryResource']) {
    assert.match(worker, new RegExp(`\\b${helper}\\b`))
  }
  // API 1.5 page/dom bridge helpers are page-only and unavailable to a 1.4 worker.
  for (const helper of ['page.read', 'page.write', 'dom.query', 'window.create', 'files.read', 'net.request']) {
    assert.doesNotMatch(worker, new RegExp(`request\\(['"]${helper}`))
  }
})

test('the published package carries only the declaration and its referenced payload', async t => {
  const { stage, publishFiles, cleanup } = await stagePlugin()
  t.after(cleanup)

  const { validateDirectory } = await loadVendoredCli()
  const validation = await validateDirectory(stage)
  assert.equal(validation.manifest.id, 'cn.example.cyrene.plugin')
  assert.deepEqual(validation.manifest.engine, { min: '1.4.0', max: '1.4.0' })
  assert.equal(validation.manifest.contributes.settings.sections.length, 2)
  assert.deepEqual(validation.manifest.contributes.pages.map(page => page.id), ['draw-studio'])

  // The declaration files are manifests, not payload; every other staged file must be listed.
  assert.deepEqual(
    [...validation.files].sort(),
    publishFiles.filter(file => file !== 'manifest.yml' && file !== 'contributions.json').sort()
  )

  // Development-only material must never reach the published package.
  const shipped = new Set(publishFiles)
  for (const leaked of ['bin/cnrp.mjs', 'docs/index.html', 'test/plugin-api-1.5.test.mjs', 'scripts/stage-plugin.mjs', 'vendor/cyrene-name-roller-plugin-sdk-1.4.0.tgz', 'bun.lock', 'package.json', 'manifest.api15.json', 'plugins/list.json']) {
    assert.equal(shipped.has(leaked), false, `${leaked} must not ship inside the plugin package`)
  }
})

test('the staged package packs with contributions.json covered by integrity', async t => {
  const { stage, cleanup } = await stagePlugin()
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'cnrp-split-template-'))
  t.after(async () => {
    await cleanup()
    await fs.rm(temp, { recursive: true, force: true })
  })

  const { packDirectory } = await loadVendoredCli()
  const output = path.join(temp, 'template.cnrp')
  const packed = await packDirectory(stage, output)
  assert.match(packed.manifest.integrity['contributions.json'], /^[0-9a-f]{64}$/)
  assert.match(packed.manifest.integrity['src/worker.js'], /^[0-9a-f]{64}$/)
  assert.equal(Object.hasOwn(packed.manifest.integrity, 'manifest.yml'), false)
  assert.ok((await fs.stat(output)).size > 0)
})
