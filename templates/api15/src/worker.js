import { definePlugin, page, core } from '@starcyrene/cyrene-name-roller/plugin-sdk'

definePlugin({
  async activate(context) {
    this.context = context
    this.language = await page.read(context, 'language')
  },
  async onCommand(commandId) {
    if (commandId !== 'describe') return { handled: false }
    return { handled: true, names: await core.names.read(this.context) }
  },
  async deactivate() {
    this.context = null
  }
})
