const form = document.getElementById('drawForm')
const countInput = document.getElementById('count')
const drawButton = document.getElementById('drawButton')
const toast = document.getElementById('toast')
let toastTimer

function setCount(value) {
  countInput.value = String(Math.max(1, Math.min(100, Math.floor(Number(value) || 1))))
}

function notify(message, type = 'info') {
  toast.textContent = message
  toast.dataset.type = type
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3600)
}

function setHostTheme(payload = {}) {
  const dark = payload.mode === 'dark' || payload.dark === true
  document.documentElement.classList.toggle('host-dark', dark)
}

function showReceipt(receipt) {
  document.getElementById('emptyState').hidden = true
  document.getElementById('resultPanel').hidden = false
  document.getElementById('resultHint').textContent = `已提交 ${receipt.count} 个结果并追加宿主记录。`
  document.getElementById('algorithm').textContent = receipt.target === 'people' ? 'CAF' : 'HOST'
  document.getElementById('resultNames').innerHTML = receipt.results
    .map(item => `<article><strong>${escapeHtml(item.name || item.englishName || item.id)}</strong><span>${escapeHtml(item.englishName || item.id)}</span></article>`)
    .join('')
  document.getElementById('operationId').textContent = receipt.operationId
  document.getElementById('algorithmName').textContent = `${receipt.algorithm} ${receipt.algorithmVersion}`
  document.getElementById('committedAt').textContent = new Date(receipt.committedAt).toLocaleString()
  document.getElementById('pluginId').textContent = receipt.pluginId
}

function escapeHtml(value) {
  const node = document.createElement('span')
  node.textContent = String(value || '')
  return node.innerHTML
}

document.getElementById('minus').onclick = () => setCount(Number(countInput.value) - 1)
document.getElementById('plus').onclick = () => setCount(Number(countInput.value) + 1)
countInput.onchange = () => setCount(countInput.value)
document.getElementById('target').onchange = event => {
  const gender = document.getElementById('gender')
  gender.disabled = event.target.value === 'groups'
  if (gender.disabled) gender.value = 'all'
}

window.addEventListener('message', event => {
  if (event.data?.type !== 'event') return
  if (event.data.event === 'app:theme-changed') setHostTheme(event.data.payload)
})

form.onsubmit = async event => {
  event.preventDefault()
  if (!window.CyrenePlugin?.request) return notify('请在 CyreneNameRoller 宿主中打开此页面。', 'warning')
  drawButton.disabled = true
  drawButton.querySelector('span').textContent = '宿主正在抽取…'
  try {
    const listId = document.getElementById('listId').value.trim()
    const receipt = await window.CyrenePlugin.request('draw.execute', {
      ...(listId ? { listId } : {}),
      target: document.getElementById('target').value,
      gender: document.getElementById('gender').value,
      count: Number(countInput.value),
      allowDuplicates: document.getElementById('duplicates').checked
    })
    showReceipt(receipt)
    notify('抽取已由宿主完成并记入历史。', 'success')
  } catch (error) {
    notify(error?.message || '抽取失败，请检查名单与权限。', 'warning')
  } finally {
    drawButton.disabled = false
    drawButton.querySelector('span').textContent = '开始宿主抽取'
  }
}
