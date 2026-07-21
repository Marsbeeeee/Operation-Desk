import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  Clock3,
  Code2,
  Copy,
  Database,
  FileCode2,
  FolderOpen,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Star,
  TerminalSquare,
  Wrench,
  XCircle,
} from 'lucide-react'
import './styles.css'

const fallbackTools = [
  {
    id: 'badcase-detect-agent',
    name: 'Badcase Detect Agent',
    description: 'Streamlit badcase 检查与 prompt 修复工作台。',
    category: '评估诊断',
    cwd: 'C:\\Users\\ZLSHLT2604010\\Desktop\\badcase_detect_agent',
    command: '.\\.venv312\\Scripts\\streamlit.exe run app.py',
    url: 'http://localhost:8501',
    repoUrl: 'https://github.com/Marsbeeeee/badcase_detect_agent',
    favorite: true,
    icon: 'bot',
  },
  {
    id: 'data-viewer',
    name: 'Data Viewer',
    description: '查看、筛选和分析评估数据及 benchmark 页面。',
    category: '数据查看',
    cwd: 'C:\\Users\\ZLSHLT2604010\\Desktop\\data_viewer',
    command: 'Start-Process ".\\benchmark_viewer_v3.html"',
    url: '',
    favorite: true,
    icon: 'database',
  },
  {
    id: 'eval-llm-wiki',
    name: 'Eval LLM Wiki',
    description: '面向 LLM 评测复盘的长期 Markdown 知识库。',
    category: '知识沉淀',
    cwd: 'C:\\Users\\ZLSHLT2604010\\Desktop\\eval_LLM_WiKi',
    command: 'explorer .',
    url: '',
    repoUrl: 'https://github.com/Marsbeeeee/eval_LLM_WiKi',
    favorite: true,
    icon: 'code',
  },
]

const iconMap = {
  activity: Activity,
  bot: Bot,
  code: Code2,
  database: Database,
  file: FileCode2,
  gauge: Gauge,
  terminal: TerminalSquare,
  wrench: Wrench,
}

function timeLabel(value) {
  if (!value) return '还没启动过'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

async function api(path, options) {
  const response = await fetch(path, options)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || `请求失败：${response.status}`)
  }
  return response.json()
}

function ToolIcon({ tool }) {
  const Icon = iconMap[tool.icon] || Wrench
  return (
    <div className="tool-icon">
      <Icon size={21} strokeWidth={1.9} />
    </div>
  )
}

function StatusPill({ status }) {
  const state = status?.state || 'idle'
  const copy = {
    idle: ['未启动', Clock3],
    running: ['已启动', CheckCircle2],
    failed: ['启动失败', XCircle],
    launching: ['启动中', Loader2],
  }
  const [label, Icon] = copy[state] || copy.idle
  return (
    <span className={`status-pill ${state}`}>
      <Icon size={13} className={state === 'launching' ? 'spin' : ''} />
      {label}
    </span>
  )
}

function App() {
  const [tools, setTools] = useState(fallbackTools)
  const [statuses, setStatuses] = useState({})
  const [active, setActive] = useState('all')
  const [query, setQuery] = useState('')
  const [toast, setToast] = useState('')
  const [apiReady, setApiReady] = useState(false)
  const [launching, setLaunching] = useState('')
  const [visiting, setVisiting] = useState('')

  const refreshTools = async () => {
    try {
      const data = await api('/api/tools')
      setTools(data.tools?.length ? data.tools : fallbackTools)
      setStatuses(data.statuses || {})
      setApiReady(true)
    } catch {
      setApiReady(false)
    }
  }

  useEffect(() => {
    refreshTools()
    const timer = setInterval(refreshTools, 5000)
    return () => clearInterval(timer)
  }, [])

  const categories = useMemo(() => ['全部', ...new Set(tools.map(tool => tool.category || '未分类'))], [tools])
  const filteredTools = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return tools.filter(tool => {
      const matchCategory = active === 'all' || active === tool.category
      const haystack = `${tool.name} ${tool.description} ${tool.category} ${tool.cwd} ${tool.command}`.toLowerCase()
      return matchCategory && (!keyword || haystack.includes(keyword))
    })
  }, [active, query, tools])

  const favoriteTools = tools.filter(tool => tool.favorite)
  const runningCount = Object.values(statuses).filter(status => status.state === 'running').length

  const showToast = message => {
    setToast(message)
    window.clearTimeout(showToast.timer)
    showToast.timer = window.setTimeout(() => setToast(''), 2600)
  }

  const launchTool = async tool => {
    if (!apiReady) {
      if (tool.repoUrl) {
        window.open(tool.repoUrl, '_blank', 'noopener,noreferrer')
        showToast('已打开 GitHub 仓库；本机运行需要启动本机服务')
      } else if (tool.command) {
        await navigator.clipboard?.writeText(tool.command)
        showToast('本机服务未连接，已复制启动命令')
      } else {
        showToast('这个入口没有配置 GitHub 地址或启动命令')
      }
      return
    }
    setLaunching(tool.id)
    setStatuses(current => ({ ...current, [tool.id]: { state: 'launching', lastRunAt: new Date().toISOString() } }))
    try {
      const result = await api(`/api/tools/${tool.id}/run`, { method: 'POST' })
      setStatuses(result.statuses || {})
      showToast(`${tool.name} 已发起启动`)
    } catch (error) {
      showToast(error.message)
      await refreshTools()
    } finally {
      setLaunching('')
    }
  }

  const openFolder = async tool => {
    if (!apiReady) {
      if (tool.repoUrl) {
        window.open(tool.repoUrl, '_blank', 'noopener,noreferrer')
        showToast('本机服务未连接，已改为打开 GitHub')
      } else {
        showToast(tool.cwd || '没有配置目录')
      }
      return
    }
    try {
      await api(`/api/tools/${tool.id}/folder`, { method: 'POST' })
      showToast('目录已打开')
    } catch (error) {
      showToast(error.message)
    }
  }

  const visitTool = async tool => {
    if (!tool.url) {
      showToast('这个入口没有配置访问地址')
      return
    }
    if (!apiReady) {
      window.open(tool.url, '_blank', 'noopener,noreferrer')
      showToast('本机启动器未连接，只能直接打开地址')
      return
    }

    setVisiting(tool.id)
    setStatuses(current => ({ ...current, [tool.id]: { state: 'launching', lastRunAt: new Date().toISOString(), message: 'Waiting for service URL...' } }))
    try {
      const result = await api(`/api/tools/${tool.id}/visit`, { method: 'POST' })
      setStatuses(result.statuses || {})
      showToast(`${tool.name} 已打开`)
    } catch (error) {
      showToast(error.message)
      await refreshTools()
    } finally {
      setVisiting('')
    }
  }

  const copyCommand = async tool => {
    if (!tool.command) {
      showToast('这个入口没有配置启动命令')
      return
    }
    await navigator.clipboard?.writeText(tool.command)
    showToast('启动命令已复制')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><LayoutDashboard size={20} /></div>
          <div>
            <strong>自动化操作台</strong>
            <span>Operation Desk</span>
          </div>
        </div>

        <nav className="side-nav">
          <button className={active === 'all' ? 'active' : ''} onClick={() => setActive('all')}>
            <LayoutDashboard size={18} />
            全部入口
          </button>
          {categories.slice(1).map(category => (
            <button key={category} className={active === category ? 'active' : ''} onClick={() => setActive(category)}>
              <FolderOpen size={18} />
              {category}
            </button>
          ))}
        </nav>

        <div className="api-card">
          <span className={apiReady ? 'api-dot ready' : 'api-dot'} />
          <div>
            <strong>{apiReady ? '本机启动器在线' : '仅浏览模式'}</strong>
            <p>{apiReady ? '可直接运行配置命令' : '可打开 GitHub 或复制命令'}</p>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow"><Sparkles size={14} /> LOCAL AUTOMATION HUB</p>
            <h1>把分散的自动化收进一个入口</h1>
          </div>
          <button className="icon-button" title="刷新清单" onClick={refreshTools}>
            <RefreshCw size={18} />
          </button>
        </header>

        <section className="overview">
          <div className="metric">
            <span>工具总数</span>
            <strong>{tools.length}</strong>
          </div>
          <div className="metric">
            <span>常用入口</span>
            <strong>{favoriteTools.length}</strong>
          </div>
          <div className="metric">
            <span>本次已启动</span>
            <strong>{runningCount}</strong>
          </div>
          <div className="search">
            <Search size={18} />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="搜索工具、目录或命令" />
          </div>
        </section>

        {favoriteTools.length > 0 && active === 'all' && !query && (
          <section className="quick-row">
            <div className="section-title">
              <h2>常用启动</h2>
              <p>最常碰的入口放在这里，少走几步路。</p>
            </div>
            <div className="quick-actions">
              {favoriteTools.map(tool => (
                <button key={tool.id} onClick={() => launchTool(tool)}>
                  <ToolIcon tool={tool} />
                  <span>{tool.name}</span>
                  <Play size={15} />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="tool-section">
          <div className="section-title">
            <h2>{active === 'all' ? '全部自动化' : active}</h2>
            <p>启动命令、访问地址和工作目录都来自配置文件。</p>
          </div>

          <div className="tool-grid">
            {filteredTools.map(tool => {
              const status = statuses[tool.id] || {}
              return (
                <article className="tool-card" key={tool.id}>
                  <div className="card-head">
                    <ToolIcon tool={tool} />
                    <div className="card-flags">
                      {tool.favorite && <Star size={16} fill="currentColor" />}
                      {tool.required && <span className="core-badge">核心</span>}
                      <StatusPill status={status} />
                    </div>
                  </div>
                  <h3>{tool.name}</h3>
                  <p>{tool.description}</p>
                  <dl>
                    <div>
                      <dt>目录</dt>
                      <dd>{tool.cwd || '未配置'}</dd>
                    </div>
                    <div>
                      <dt>命令</dt>
                      <dd>{tool.command || '仅打开目录或链接'}</dd>
                    </div>
                    <div>
                      <dt>最近</dt>
                      <dd>{timeLabel(status.lastRunAt)}</dd>
                    </div>
                  </dl>
                  {status.message && <div className="message-line">{status.message}</div>}
                  <div className="card-actions">
                    <button className="primary" disabled={launching === tool.id || (!tool.command && !tool.repoUrl)} onClick={() => launchTool(tool)}>
                      {launching === tool.id ? <Loader2 className="spin" size={17} /> : apiReady ? <Play size={17} /> : <ArrowUpRight size={17} />}
                      {apiReady ? '启动' : tool.repoUrl ? 'GitHub' : '复制命令'}
                    </button>
                    {!apiReady && tool.command && (
                      <button className="secondary" onClick={() => copyCommand(tool)}>
                        <Copy size={16} />
                        命令
                      </button>
                    )}
                    {tool.url && (
                      <button className="secondary" disabled={visiting === tool.id} onClick={() => visitTool(tool)}>
                        {visiting === tool.id ? <Loader2 className="spin" size={16} /> : <ArrowUpRight size={16} />}
                        访问
                      </button>
                    )}
                    <button className="secondary" onClick={() => openFolder(tool)}>
                      <FolderOpen size={16} />
                      {apiReady ? '目录' : tool.repoUrl ? '仓库' : '目录'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {filteredTools.length === 0 && (
            <div className="empty">
              <Search size={28} />
              <h2>没有找到匹配的入口</h2>
              <p>换个关键词，或者在 automation.config.json 里加一条。</p>
            </div>
          )}
        </section>

        <section className="flow-panel">
          <div>
            <GitBranch size={21} />
            <strong>下一步可以把“入口”升级成“流程”</strong>
            <p>比如：拉取数据 → 跑 badcase 检测 → 写入 Wiki → 打开报告。现在的配置已经给后续编排留好了位置。</p>
          </div>
          <TerminalSquare size={42} />
        </section>
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
