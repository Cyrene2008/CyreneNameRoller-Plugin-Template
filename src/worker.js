import { definePlugin, core, page, PluginEvents } from '@starcyrene/cyrene-name-roller/plugin-sdk'

const DEFAULTS = { enabled: true, volume: 0.7, mode: 'summary', sound: null }
let request
let platform
let pluginContext

async function settings() {
  return { ...DEFAULTS, ...((await request('storage.read', { key: 'settings' })) || {}) }
}

definePlugin({
  async activate(context) {
    pluginContext = context
    request = context.request
    platform = context.platform
    this.language = await page.read(context, 'language')
  },

  async onEvent(event, payload) {
    if (event === PluginEvents.APP_READY) await core.names.read(pluginContext)
  },

  async onCommand(commandId) {
    if (commandId === 'refresh') return { handled: true, settings: await settings() }
    if (commandId === 'show-statistics') return core.statistics.read(pluginContext)
    return { handled: false }
  },

  async deactivate() {
    pluginContext = null
    request = null
    platform = null
  }
})

