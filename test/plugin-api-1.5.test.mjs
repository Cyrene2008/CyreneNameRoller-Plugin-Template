import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import * as sdk from '../src/plugin-sdk.mjs'
import { createTemplate, packDirectory, validateDirectory } from '../bin/cnrp.mjs'

test('publishes explicit API 1.5 groups and before/after operations', async () => {
  assert.equal(sdk.PLUGIN_API_VERSION, '1.5.0')
  assert.equal(typeof sdk.PluginApiError, 'function')
  assert.equal('execute' in sdk.dom, false)
  for (const [group, methods] of Object.entries({
    page: ['read', 'write'],
    window: ['create', 'close'],
    files: ['read', 'write'],
    net: ['request'],
    state: ['read', 'write'],
    core: ['names.read', 'records.read', 'statistics.read', 'hook.before', 'hook.after']
  })) {
    assert.equal(typeof sdk[group], 'object')
    for (const method of methods) assert.equal(typeof sdk[group][method], 'function')
  }

  const calls = []
  const context = { request: async (method, args) => { calls.push(method); return { ok: true, method, args } } }
  await sdk.page.read(context, 'language')
  await sdk.core.hook.before(context, 'name-draw', {})
  await sdk.core.hook.after(context, 'name-draw', {})
  assert.deepEqual(calls, ['page.read', 'core.hook.before', 'core.hook.after'])
})

test('validates and packs the canonical API 1.5 template', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cnrp-template-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const source = path.join(root, 'plugin')
  const output = path.join(root, 'plugin.cnrp')
  await createTemplate(source, 'api15')
  const validation = await validateDirectory(source)
  assert.equal(validation.manifest.api, '1.5')
  assert.equal(validation.manifest.entry.runtime, 'cnrp-runner')
  assert.equal(validation.manifest.permissions[0].required, true)
  const packed = await packDirectory(source, output)
  assert.ok(packed.manifest.integrity['src/worker.js'])
  assert.ok((await fs.stat(output)).size > 0)
})

test('rejects API 1.4 publication manifests', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cnrp-legacy-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(path.join(root, 'manifest.json'), JSON.stringify({
    schemaVersion: 1,
    id: 'cn.example.legacy',
    name: 'Legacy',
    version: '1.0.0',
    author: 'Test',
    engine: { min: '1.4.0', max: '1.4.0' },
    entry: 'src/worker.js',
    permissions: []
  }))
  await assert.rejects(() => validateDirectory(root), /API 1\.5 manifest is required|API 1\.4 publication is not supported/i)
})
