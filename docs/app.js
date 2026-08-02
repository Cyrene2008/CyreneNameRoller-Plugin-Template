const events = [
  ['app:ready', 'events:lifecycle', '插件系统与宿主就绪。'],
  ['app:route-changed', 'events:lifecycle', '主路由或 Dock 页面发生变化。'],
  ['app:theme-changed', 'events:lifecycle', '提供 theme、dark、accent、perfAnimations、reducedMotion；视觉层必须据此暂停或恢复。'],
  ['app:resize', 'events:lifecycle', '宿主可用视口发生变化。'],
  ['plugin:storage-changed', 'events:lifecycle', '仅通知写入该键的插件，并覆盖其 Worker、页面和已订阅视觉层。'],
  ['draw:item-result', 'events:draw', '任意宿主抽取逐项结果。'],
  ['draw:result', 'events:draw', '任意宿主抽取汇总结果。'],
  ['roller:start', 'events:draw', '随机点名开始。'],
  ['roller:item-result', 'events:draw', '随机点名逐项结果，适合逐个播放或展示。'],
  ['roller:result', 'events:draw', '随机点名汇总结果，每次操作一次。'],
  ['card:item-result', 'events:draw', '翻牌模式逐项结果。'],
  ['card:result', 'events:draw', '翻牌模式汇总结果。'],
  ['lottery:item-result', 'events:draw', '抽奖逐项结果。'],
  ['lottery:result', 'events:draw', '单纯抽奖汇总结果。'],
  ['lottery:assign-result', 'events:draw', '先抽人再分配奖品的汇总结果。']
]

const rpc = [
  ['runtime.platform', '无需权限', '读取 Web/Tauri、操作系统及 desktop 状态。'],
  ['runtime.capabilities', '无需权限', '读取当前平台全部能力及可用状态。'],
  ['storage.read', 'storage:read', '读取插件自己的命名空间。'],
  ['storage.write', 'storage:write', '写入插件自己的命名空间。'],
  ['names.read', 'names:read', '读取名单、人员、小组快照；不可写。'],
  ['records.read', 'records:read', '读取抽取历史快照；不可写。'],
  ['statistics.read', 'statistics:read', '读取 UUID 统计计数与总次数；不可写。'],
  ['balance.read', 'balance:read', '读取公平算法状态与公开参数；不可写。'],
  ['draw.execute', 'draw:execute', '提交有限筛选条件；宿主完成 CAF、统计与历史追加事务。'],
  ['notifications.show', 'notifications:show', '显示宿主 Fluent 页面内通知。'],
  ['audio.select', 'audio:select', '让用户选择本地音频并返回 data URL。'],
  ['audio.play', 'audio:play', '播放已选择的本地音频。'],
  ['system.open-url', 'system:open-url', '打开 HTTP、HTTPS 或 mailto。'],
  ['system.select-file', 'system:select-file', '用户授权选择并读取文件。'],
  ['system.select-directory', 'system:select-directory', 'Tauri 选择本地目录。'],
  ['system.clipboard-read', 'system:clipboard-read', '读取剪贴板文本。'],
  ['system.clipboard-write', 'system:clipboard-write', '写入剪贴板文本。'],
  ['system.reveal-file', 'system:reveal-file', '定位本次运行中用户已授权的路径。'],
  ['system.execute', 'system:execute', '执行清单中固定声明的桌面系统操作。'],
  ['dependency.storage.read', '依赖 dataAccess', '通过 readDependencyStorage() 读取前置插件明确共享的数据。']
]

const platforms = [
  ['notifications / audio', 'Web ✓', 'Tauri ✓'],
  ['open-url / select-file', 'Web ✓', 'Tauri ✓'],
  ['clipboard', '取决于浏览器授权', '取决于 WebView 授权'],
  ['select-directory', '安全跳过', 'Tauri ✓'],
  ['reveal-file', '安全跳过', 'Tauri ✓'],
  ['system.execute', '安全跳过', 'Tauri ✓（固定清单操作）']
]

function table(target, headings, rows) {
  const node = document.getElementById(target)
  node.innerHTML = `<div class="table-row head">${headings.map(value => `<strong>${value}</strong>`).join('')}</div>` + rows.map(row => `<div class="table-row"><code>${row[0]}</code><strong>${row[1]}</strong><span>${row[2]}</span></div>`).join('')
}

table('eventsTable', ['事件', '权限', '说明'], events)
table('rpcTable', ['RPC', '权限', '说明'], rpc)
table('platformTable', ['能力', 'Web', 'Tauri'], platforms)

const root = document.documentElement
const savedTheme = localStorage.getItem('cyrene-docs-theme')
if (savedTheme === 'dark' || (!savedTheme && matchMedia('(prefers-color-scheme: dark)').matches)) root.classList.add('dark')
document.getElementById('themeButton').onclick = () => {
  root.classList.toggle('dark')
  localStorage.setItem('cyrene-docs-theme', root.classList.contains('dark') ? 'dark' : 'light')
}

const range = document.getElementById('demoRange')
range.oninput = () => { document.getElementById('rangeValue').textContent = `${range.value}%` }

document.querySelectorAll('#demoTabs button').forEach(button => button.onclick = () => {
  document.querySelectorAll('#demoTabs button').forEach(item => item.classList.toggle('active', item === button))
  document.getElementById('tabResult').textContent = `当前：${button.textContent}`
})

let toastTimer
document.getElementById('toastButton').onclick = () => {
  const toast = document.getElementById('toast')
  toast.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200)
}

const modal = document.getElementById('modal')
document.getElementById('modalButton').onclick = () => { modal.hidden = false }
document.getElementById('modalCancel').onclick = () => { modal.hidden = true }
document.getElementById('modalConfirm').onclick = () => { modal.hidden = true; document.getElementById('toastButton').click() }
modal.onclick = event => { if (event.target === modal) modal.hidden = true }

