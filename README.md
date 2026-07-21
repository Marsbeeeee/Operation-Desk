# 自动化操作台

这是一个本地自动化入口汇总台，用来把散落在桌面上的脚本、页面、Streamlit 应用和项目目录集中到一个可搜索、可启动、可打开目录的工作台里。

## 当前功能

- 集中展示本地自动化入口
- 按分类查看工具
- 搜索工具名称、描述、目录和启动命令
- 一键启动已配置的本地命令
- 一键打开工具对应的工作目录
- 本机服务不可用时，自动退化为 GitHub 仓库入口或复制启动命令
- 展示本次会话内的启动状态和最近启动时间
- 通过 `automation.config.json` 维护工具清单

## 核心入口

- **Badcase Detect Agent**：Streamlit badcase 检查与 prompt 修复工作台
- **Data Viewer**：评估数据与 benchmark 查看入口
- **Eval LLM Wiki**：LLM 评测复盘 Markdown 知识库
- **Eval SOP Skill**：评估标注 SOP skill 本地目录
- **Codex Usage Dashboard**：Codex 使用量追踪 dashboard 开发入口

这 5 个入口是操作台的核心入口，缺一不可。它们在 `automation.config.json` 中会标记为 `required: true`。

## 启动方式

操作台有两种模式：

- **本机模式**：可以点击“启动”真实运行本地命令。
- **浏览模式**：没有本机启动器时，只能打开 GitHub、访问已启动页面或复制命令。

推荐直接双击：

```text
start-desk.cmd
```

它会构建前端、启动本机操作台服务，并自动打开浏览器。

在当前目录执行：

```powershell
npm.cmd run desk
```

启动后打开：

```text
http://127.0.0.1:4317
```

请通过 `http://127.0.0.1:4317` 使用操作台。只有这个地址会连接本机启动器，才能点击“启动”和“目录”执行真实操作。

如果只打开静态页面，或者以后部署到 GitHub Pages，页面仍然可用，但会进入浏览模式：能打开已配置的 GitHub 仓库，或者复制启动命令到本机终端执行。

## 常用开发命令

只启动前端开发服务：

```powershell
npm.cmd run dev
```

这个模式只适合改界面；它不会启动本机命令执行 API。

构建前端产物：

```powershell
npm.cmd run build
```

校验核心入口配置：

```powershell
npm.cmd run check:tools
```

只启动本地操作台服务：

```powershell
npm.cmd run start
```

## 新增或修改工具

编辑 `automation.config.json`，在 `tools` 数组里新增一项即可：

```json
{
  "id": "my-tool",
  "name": "My Tool",
  "description": "这个工具用来做什么",
  "category": "效率工具",
  "cwd": "C:\\Users\\ZLSHLT2604010\\Desktop\\my-tool",
  "command": "npm.cmd run dev",
  "url": "http://localhost:5173",
  "repoUrl": "https://github.com/Marsbeeeee/my-tool",
  "favorite": true,
  "icon": "terminal"
}
```

字段说明：

- `id`：工具唯一标识，建议使用英文小写和连字符
- `name`：操作台展示名称
- `description`：工具说明
- `category`：工具分类
- `cwd`：命令执行目录，也是“目录”按钮打开的位置
- `command`：点击“启动”时执行的 PowerShell 命令
- `url`：可选，配置后会显示“访问”按钮
- `repoUrl`：可选，本机服务不可用时打开的 GitHub 仓库地址
- `favorite`：是否显示在常用启动区
- `icon`：图标类型，可用值包括 `bot`、`database`、`code`、`file`、`gauge`、`terminal`、`wrench`、`activity`

## 注意事项

- Windows PowerShell 可能会限制 `npm.ps1`，所以配置里建议写 `npm.cmd`。
- 本操作台只监听本机地址 `127.0.0.1`。
- “启动状态”只记录当前操作台服务运行期间的信息，重启后会清空。
