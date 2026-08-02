import { defineVisualSurface } from '@cyrene2008/cyrene-name-roller/plugin-sdk'

const PARTICLE_COUNT = 34
let canvas
let context
let viewport = { width: 1, height: 1, dpr: 1, pixelWidth: 1, pixelHeight: 1 }
let timer = null
let particles = []
let burstUntil = 0
let dark = false
let motionDisabled = false

function clearCanvas() {
  if (context && canvas) context.clearRect(0, 0, canvas.width, canvas.height)
}

function resetParticles() {
  const width = Math.max(1, viewport.pixelWidth)
  const height = Math.max(1, viewport.pixelHeight)
  particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
    x: (index * 97.3 % 100) / 100 * width,
    y: (index * 53.7 % 100) / 100 * height,
    radius: (1.2 + (index % 5) * 0.55) * viewport.dpr,
    speed: (0.08 + (index % 7) * 0.018) * viewport.dpr,
    drift: ((index % 3) - 1) * 0.025 * viewport.dpr,
    phase: index * 0.61
  }))
}

function render() {
  if (!context || !canvas) return
  const width = canvas.width
  const height = canvas.height
  const now = Date.now()
  context.clearRect(0, 0, width, height)

  const glow = context.createRadialGradient(width * 0.72, height * 0.18, 0, width * 0.72, height * 0.18, Math.max(width, height) * 0.62)
  glow.addColorStop(0, dark ? 'rgba(255,126,177,.105)' : 'rgba(216,75,130,.09)')
  glow.addColorStop(1, 'rgba(216,75,130,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, width, height)

  const burst = now < burstUntil ? 1 - (burstUntil - now) / 950 : 0
  for (const particle of particles) {
    particle.y -= particle.speed * (burst ? 3.2 : 1)
    particle.x += particle.drift
    if (particle.y < -12) particle.y = height + 12
    if (particle.x < -12) particle.x = width + 12
    if (particle.x > width + 12) particle.x = -12
    const pulse = .55 + Math.sin(now / 900 + particle.phase) * .25
    context.beginPath()
    context.arc(particle.x, particle.y, particle.radius * (1 + burst * .8), 0, Math.PI * 2)
    context.fillStyle = dark
      ? `rgba(255,150,190,${.06 + pulse * .07})`
      : `rgba(207,67,119,${.045 + pulse * .055})`
    context.fill()
  }
}

function start() {
  if (timer || motionDisabled) return
  timer = setInterval(render, 1000 / 30)
}

function stop() {
  if (timer) clearInterval(timer)
  timer = null
}

defineVisualSurface({
  activate(pluginContext) {
    canvas = pluginContext.canvas
    context = canvas.getContext('2d', { alpha: true })
    start()
  },

  onResize(nextViewport) {
    viewport = { ...viewport, ...nextViewport }
    canvas.width = Math.max(1, viewport.pixelWidth)
    canvas.height = Math.max(1, viewport.pixelHeight)
    resetParticles()
    if (motionDisabled) clearCanvas()
    else render()
  },

  onEvent(event, payload) {
    if (event === 'app:theme-changed') {
      dark = payload?.mode === 'dark' || payload?.dark === true
      motionDisabled = payload?.reducedMotion === true || payload?.perfAnimations === false
      if (motionDisabled) {
        stop()
        burstUntil = 0
        clearCanvas()
      } else {
        render()
        start()
      }
    }
    if (event === 'draw:result' && !motionDisabled) burstUntil = Date.now() + 950
  },

  deactivate() {
    stop()
    clearCanvas()
    particles = []
    context = null
    canvas = null
  }
})
