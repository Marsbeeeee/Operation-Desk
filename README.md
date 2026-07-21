# 自动化操作台

团队自动化入口页，用来把评估诊断、数据查看、知识库、SOP Skill 和 Codex 使用量追踪集中到一个可搜索、可复制、可跳转的操作台里。

团队成员优先使用 GitHub Pages 静态页面；本机启动器只用于个人电脑上需要直接运行本地命令的场景。

## 核心入口

这 5 个入口缺一不可，都会在 `automation.config.json` 中标记为 `required: true`。

- **Badcase Detect Agent**：通过 Codex Skill 做 prompt compliance badcase 分析与修复实验
- **Data Viewer**：评估数据与 benchmark 查看入口
- **Eval LLM Wiki**：LLM 评测复盘 Markdown 知识库，可复制 ingest / query / lint 任务模板
- **Eval SOP Skill**：评估标注 SOP Skill 入口
- **Codex Usage Dashboard**：Codex 使用量追踪 dashboard 开发入口

## 团队仓库

- [Marsbeeeee/badcase_detect_agent](https://github.com/Marsbeeeee/badcase_detect_agent)
- [Marsbeeeee/leap-sop-agent-skill](https://github.com/Marsbeeeee/leap-sop-agent-skill)
- [Marsbeeeee/Data-Viewer](https://github.com/Marsbeeeee/Data-Viewer)
- [Marsbeeeee/eval_LLM_WiKi](https://github.com/Marsbeeeee/eval_LLM_WiKi)
- [douglasmonsky/codex-usage-tracker](https://github.com/douglasmonsky/codex-usage-tracker)

## 功能

- 集中展示 5 个团队核心自动化入口
- 按分类查看和搜索工具
- Skill 类入口可复制 Codex 调用指令
- Wiki 类入口可复制 Codex 维护任务模板
- 仓库类入口可跳转到 GitHub
- 本机服务不可用时，自动退化为团队浏览模式
- 个人本机模式下，可启动本地命令、打开工作目录、访问本地 Web 服务
- 启动前校验核心入口是否完整

## 团队共享

推送到 `main` 后，GitHub Actions 会自动构建并发布 GitHub Pages。

仓库地址：

```text
https://github.com/Marsbeeeee/Operation-Desk
```

Pages 地址通常是：

```text
https://marsbeeeee.github.io/Operation-Desk/
```

如果 Pages 还没有打开，需要在 GitHub 仓库的 `Settings -> Pages` 中选择 `GitHub Actions` 作为发布来源。

## 本机启动

在个人电脑上需要直接运行本地命令时，双击：

```text
start-desk.cmd
```

或者在当前目录执行：

```powershell
npm.cmd run desk
```

启动后打开：

```text
http://127.0.0.1:4317
```

注意：只有 `http://127.0.0.1:4317` 会连接本机启动器。GitHub Pages 版本不会执行本机命令，只会打开仓库、复制 Skill 指令或复制启动命令。

## 开发命令

校验核心入口：

```powershell
npm.cmd run check:tools
```

本地开发前端：

```powershell
npm.cmd run dev
```

构建静态页面：

```powershell
npm.cmd run build
```

只启动本机操作台服务：

```powershell
npm.cmd run start
```

## 配置入口

入口统一维护在 `automation.config.json`：

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
  "skillName": "my-skill",
  "skillPrompt": "$my-skill 处理这个任务",
  "required": true,
  "favorite": true,
  "icon": "terminal"
}
```

常用字段：

- `id`：工具唯一标识
- `name`：展示名称
- `description`：用途说明
- `category`：分类
- `repoUrl`：团队版优先打开的 GitHub 仓库
- `skillName`：Codex Skill 名称；配置后主按钮会变成“复制 Skill”
- `skillPrompt`：复制到剪贴板的默认 Skill 调用指令
- `actionLabel`：自定义主按钮文案
- `actionText`：复制到剪贴板的操作模板
- `cwd`：个人本机模式下的工作目录
- `command`：个人本机模式下执行的命令
- `url`：个人本机模式下访问的本地 Web 服务地址
- `required`：是否核心入口
- `favorite`：是否显示在常用区
- `icon`：图标类型
