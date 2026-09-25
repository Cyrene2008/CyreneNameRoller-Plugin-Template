import { definePlugin, PluginEvents, describeHost, executeDraw, queryResource } from '@starcyrene/cyrene-name-roller/plugin-sdk'

const DEFAULTS = { enabled: true, volume: 0.7, mode: 'summary', sound: null }
let pluginContext
let request

async function settings() {
  return { ...DEFAULTS, ...((await request('storage.read', { key: 'settings' })) || {}) }
}

definePlugin({
  async activate(context) {
    pluginContext = context
    request = context.request
  },

  async onEvent(event, payload) {
    if (event !== PluginEvents.APP_READY) return
    // Read-only host snapshot; the plugin never sees the core worker or its request ids.
    await queryResource(pluginContext, 'names')
  },

  async onCommand(commandId) {
    if (commandId === 'refresh') return { handled: true, settings: await settings() }
    if (commandId === 'draw-one') {
      // Host-owned transaction: the plugin submits intent only and receives the committed receipt.
      const receipt = await executeDraw(pluginContext, { count: 1 })
      return { handled: true, operationId: receipt.operationId, count: receipt.count }
    }
    if (commandId === 'show-statistics') return { handled: true, statistics: await queryResource(pluginContext, 'statistics') }
    if (commandId === 'describe-host') return { handled: true, host: await describeHost(pluginContext) }
    return { handled: false }
  },

  async deactivate() {
    pluginContext = null
    request = null
  }
})
