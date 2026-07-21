import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { spawn } from 'node:child_process'

const rootDir = process.cwd()
const distDir = resolve(rootDir, 'dist')
const configPath = resolve(rootDir, 'automation.config.json')
const port = Number(process.env.OPERATION_DESK_PORT || 4317)
const statuses = new Map()

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
}

async function loadConfig() {
  const raw = await readFile(configPath, 'utf8')
  const config = JSON.parse(raw)
  return Array.isArray(config.tools) ? config.tools : []
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  response.end(JSON.stringify(data))
}

function setStatus(toolId, nextStatus) {
  statuses.set(toolId, {
    state: 'idle',
    lastRunAt: new Date().toISOString(),
    ...statuses.get(toolId),
    ...nextStatus,
  })
}

function publicStatuses() {
  return Object.fromEntries(statuses.entries())
}

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms))
}

function escapePowerShellString(value) {
  return String(value).replaceAll("'", "''")
}

function runVisiblePowerShell(command, cwd) {
  const location = escapePowerShellString(cwd || rootDir)
  const script = `Set-Location -LiteralPath '${location}'; ${command}`

  return spawn('cmd.exe', ['/d', '/c', 'start', '', 'powershell.exe', '-NoExit', '-ExecutionPolicy', 'Bypass', '-Command', script], {
    cwd: rootDir,
    detached: true,
    shell: false,
    stdio: 'ignore',
    windowsHide: false,
  })
}

async function runTool(tool) {
  if (!tool.command) throw new Error('这个工具没有配置启动命令')
  if (tool.cwd) await stat(tool.cwd)

  const child = runVisiblePowerShell(tool.command, tool.cwd || rootDir)
  child.unref()
  setStatus(tool.id, {
    state: 'running',
    pid: child.pid,
    command: tool.command,
    message: '',
  })
}

function openUrl(url) {
  const child = spawn('cmd.exe', ['/c', 'start', '', url], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.unref()
}

async function isUrlReady(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(1200),
    })
    return response.status < 500
  } catch {
    return false
  }
}

async function waitForUrl(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await isUrlReady(url)) return true
    await sleep(900)
  }
  return false
}

async function visitTool(tool) {
  if (!tool.url) throw new Error('这个工具没有配置访问地址')
  const timeoutMs = tool.visitTimeoutMs || 20000

  if (!await isUrlReady(tool.url)) {
    if (!tool.command) throw new Error('服务未运行，而且这个工具没有配置启动命令')
    await runTool(tool)
  }

  setStatus(tool.id, { state: 'launching', message: 'Waiting for service URL...' })
  const ready = await waitForUrl(tool.url, timeoutMs)
  if (!ready) {
    throw new Error(`服务还没就绪：${tool.url}。请查看弹出的 PowerShell 窗口里的报错。`)
  }

  openUrl(tool.url)
  setStatus(tool.id, { state: 'running', message: '' })
}

async function openFolder(tool) {
  if (!tool.cwd) throw new Error('这个工具没有配置工作目录')
  await stat(tool.cwd)
  const escaped = escapePowerShellString(tool.cwd)
  const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `Start-Process -LiteralPath '${escaped}'`], {
    cwd: rootDir,
    detached: true,
    shell: false,
    stdio: 'ignore',
    windowsHide: true,
  })
  child.unref()
}

async function handleApi(request, response, url) {
  const tools = await loadConfig()

  if (request.method === 'GET' && url.pathname === '/api/tools') {
    sendJson(response, 200, { tools, statuses: publicStatuses() })
    return true
  }

  const runMatch = url.pathname.match(/^\/api\/tools\/([^/]+)\/run$/)
  if (request.method === 'POST' && runMatch) {
    const tool = tools.find(item => item.id === decodeURIComponent(runMatch[1]))
    if (!tool) {
      sendJson(response, 404, { error: '没有找到这个工具' })
      return true
    }

    try {
      setStatus(tool.id, { state: 'launching', message: '' })
      await runTool(tool)
      sendJson(response, 200, { ok: true, statuses: publicStatuses() })
    } catch (error) {
      setStatus(tool.id, { state: 'failed', message: error.message })
      sendJson(response, 500, { error: error.message, statuses: publicStatuses() })
    }
    return true
  }

  const visitMatch = url.pathname.match(/^\/api\/tools\/([^/]+)\/visit$/)
  if (request.method === 'POST' && visitMatch) {
    const tool = tools.find(item => item.id === decodeURIComponent(visitMatch[1]))
    if (!tool) {
      sendJson(response, 404, { error: '没有找到这个工具' })
      return true
    }

    try {
      await visitTool(tool)
      sendJson(response, 200, { ok: true, statuses: publicStatuses() })
    } catch (error) {
      setStatus(tool.id, { state: 'failed', message: error.message })
      sendJson(response, 500, { error: error.message, statuses: publicStatuses() })
    }
    return true
  }

  const folderMatch = url.pathname.match(/^\/api\/tools\/([^/]+)\/folder$/)
  if (request.method === 'POST' && folderMatch) {
    const tool = tools.find(item => item.id === decodeURIComponent(folderMatch[1]))
    if (!tool) {
      sendJson(response, 404, { error: '没有找到这个工具' })
      return true
    }

    try {
      await openFolder(tool)
      sendJson(response, 200, { ok: true })
    } catch (error) {
      sendJson(response, 500, { error: error.message })
    }
    return true
  }

  return false
}

async function serveStatic(response, pathname) {
  const safePath = pathname === '/' ? '/index.html' : pathname
  const filePath = resolve(distDir, `.${decodeURIComponent(safePath)}`)

  if (!filePath.startsWith(distDir)) {
    response.writeHead(403)
    response.end('Forbidden')
    return
  }

  try {
    const info = await stat(filePath)
    if (!info.isFile()) throw new Error('Not a file')
    response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' })
    createReadStream(filePath).pipe(response)
  } catch {
    const indexPath = join(distDir, 'index.html')
    response.writeHead(200, { 'Content-Type': mimeTypes['.html'] })
    createReadStream(indexPath).pipe(response)
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)

  try {
    if (url.pathname.startsWith('/api/') && await handleApi(request, response, url)) return
    await serveStatic(response, url.pathname)
  } catch (error) {
    sendJson(response, 500, { error: error.message })
  }
}).listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`
  console.log(`Operation Desk is running at ${url}`)
  if (process.env.OPERATION_DESK_OPEN === '1') {
    openUrl(url)
  }
})
