import { definePlugin, PluginEvents } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

const DEFAULTS = { enabled: true, volume: 0.7, mode: 'summary', sound: null }
let request
let platform

async function settings() {
  return { ...DEFAULTS, ...((await request('storage.read', { key: 'settings' })) || {}) }
}

definePlugin({
  async activate(context) {
    request = context.request
    platform = context.platform
  },

  async onEvent(event, payload) {
    if (event === PluginEvents.APP_READY) {
      await request('storage.write', {
        key: 'last-runtime',
        value: { runtime: platform.runtime, os: platform.os, readyAt: Date.now() }
      })
      return
    }

    if (event === PluginEvents.APP_THEME_CHANGED) {
      await request('storage.write', {
        key: 'last-theme',
        value: { mode: payload?.mode || 'unknown', changedAt: Date.now() }
      })
      return
    }

    const config = await settings()
    if (!config.enabled) return
    const expectedEvent = config.mode === 'each' ? PluginEvents.ROLLER_ITEM_RESULT : PluginEvents.ROLLER_RESULT
    if (event !== expectedEvent) return
    if (config.sound?.dataUrl) {
      await request('audio.play', { source: config.sound.dataUrl, volume: config.volume })
    }
    const count = payload?.results?.length || (payload?.result ? 1 : 0)
    await request('notifications.show', {
      message: `Template plugin received ${count || 1} result(s).`,
      type: 'info',
      duration: 3500
    })
  },

  async deactivate() {
    request = null
    platform = null
  }
})

