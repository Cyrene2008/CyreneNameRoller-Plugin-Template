import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')

/**
 * Exactly what the published plugin package contains: the split declaration plus the payload the
 * host references (worker, visual surface, Dock page and its assets, animation pack, native views).
 * Repository tooling (scripts/, CI workflows, test/, docs/, lockfile, vendor SDK, the retained
 * API 1.5 material) is development-only and must never ship inside the .cnrp.
 */
const publishFiles = Object.freeze([
  'manifest.yml',
  'contributions.json',
  'README.md',
  'assets/icon.svg',
  'animations/template-motion.json',
  'pages/draw-studio.html',
  'pages/draw-studio.css',
  'pages/draw-studio.js',
  'src/worker.js',
  'src/visual.js',
  'views/below-result.json',
  'views/records-toolbar.json',
  'views/roller-stats.json'
])

// The manifest validator only checks the files the manifest itself references. A page's own
// <link>/<script> targets are resolved by the host iframe bridge at runtime, which leaves the
// original tag untouched when the asset is absent, so a forgotten sibling asset would ship as a
// silently broken page. Resolve them here so the publish list cannot drift quietly.
const LOCAL_REFERENCE_PATTERN = /(?:src|href)\s*=\s*["']([^"']+)["']/gi

async function assertPageReferencesResolve(stage, files) {
  const shipped = new Set(files)
  const missing = []
  for (const relativePath of files) {
    if (!/\.html?$/i.test(relativePath)) continue
    const html = await fs.readFile(path.join(stage, relativePath), 'utf8')
    for (const match of html.matchAll(LOCAL_REFERENCE_PATTERN)) {
      const reference = match[1].trim()
      if (!reference || /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), reference.split(/[?#]/)[0]))
      if (!resolved || resolved.startsWith('..')) continue
      if (!shipped.has(resolved)) missing.push(`${relativePath} references ${resolved}`)
    }
  }
  if (missing.length) {
    throw new Error(`publish list is incomplete: ${missing.join(', ')}. Add the missing file(s) to publishFiles in scripts/stage-plugin.mjs.`)
  }
}

export async function stagePlugin() {
  // Keep the staging tree beside the project. Some locked-down Windows
  // environments allow Node to create an OS temp directory but prevent
  // esbuild from traversing its parent while resolving a Worker entry.
  const stage = await fs.mkdtemp(path.join(root, '.cnrp-stage-'))
  try {
    for (const relativePath of publishFiles) {
      const source = path.join(root, relativePath)
      const target = path.join(stage, relativePath)
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.copyFile(source, target)
    }
    await assertPageReferencesResolve(stage, publishFiles)
  } catch (error) {
    await fs.rm(stage, { recursive: true, force: true })
    throw error
  }
  return {
    root,
    stage,
    publishFiles,
    async cleanup() {
      await fs.rm(stage, { recursive: true, force: true })
    }
  }
}
