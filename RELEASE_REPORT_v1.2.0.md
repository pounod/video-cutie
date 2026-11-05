# 优化完成汇报（v1.2.0）

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.2.0
- **运行平台**：macOS 11.0 Big Sur 及以上（全面支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用双架构（原生同时兼容 Apple Silicon M1/M2/M3/M4 与 Intel x86_64）
- **客户端架构**：原生 macOS Cocoa + WebKit 独立桌面窗口程序（离线独立运行，零外部依赖）
- **内置引擎**：FFmpeg 原生二进制预打包至 `Contents/MacOS/ffmpeg`（无需安装终端，无需配置 Homebrew）
- **核心算法**：音视频流无损直接拷贝（`-c:v copy -c:a copy`）+ 毫秒级时间戳精准对齐（`-avoid_negative_ts make_zero`）

---

### 🚀 核心优化与重大改进

#### 1. 彻底根治「打开应用仅有空白外框、无内核界面内容」的核心 Bug
- **根因深度排查**：
  - **WebKit 对 `file://` 协议下 ES Module 的 CORS 拦截**：Vite 现代构建产物采用 `<script type="module">` 组织代码。当 macOS 原生视窗通过 `file:///.../index.html` 打开时，WebKit 视 `file://` 为不透明同源或受限环境，强制应用跨域与严格 MIME-Type 检查，导致浏览器内核直接拒绝执行本地 JS 脚本；
  - **表现**：DOM 中的 `<div id="root"></div>` 无法挂载任何 React 组件，导致用户打开应用后仅能看到一个空白的原生外框，没有任何操作内容。
- **工业级解决方案（WKURLSchemeHandler）**：
  - 在 `src-macos/main.swift` 中实现遵循 WebKit 规范的 `LocalBundleSchemeHandler: NSObject, WKURLSchemeHandler`；
  - 注册自定义安全协议 `app://localhost/index.html`，以标准 HTTP/1.1 语义向内核响应各类资源；
  - 自动根据文件后缀映射并返回准确的 `Content-Type`（如 `text/javascript; charset=utf-8`、`text/css; charset=utf-8` 等）及 `Access-Control-Allow-Origin: *` 头；
  - 彻底避开 `file://` 协议的模块执行限制，确保在 macOS 11 至 macOS 15+ 上秒开渲染完整功能界面！

#### 2. 全新应用图标替换（已采纳附件 Splice V 纯净设计）
- **图标更新**：采用附件提供的最新超清设计（深色圆角矩形基底 + 渐变亮粉/深紫/青蓝几何剪辑 "V" 标）；
- **全端同步**：已同步更新桌面视窗左上角、主工作区、GitHub `README.md`，并重新编译生成全尺寸 Retina `AppIcon.icns`（16×16 至 1024×1024）与安装包卷标。

#### 3. 严格落实最初 7 项核心业务需求（剔除冗余与无关功能）
- ✅ **需求 1（视频拖拽与参数识别）**：支持将本地视频文件拖入客户端，或点击选择。原生精准提取视频文件名、本地绝对物理路径、时长、分辨率、视频编码与音频编码；
- ✅ **需求 2（起止时间输入与默认边界）**：开始时间默认 `00:00:00`（0 秒），结束时间默认视频最长播放时间；
- ✅ **需求 3（智能时间补全 012536 → 01:25:36）**：用户在输入框输入 `012536`，系统毫秒级自动补全格式化为标准 `01:25:36`，并即时同步到操作界面；
- ✅ **需求 4（无损音视频流复制）**：内置执行参数 `-c:v copy -c:a copy -avoid_negative_ts make_zero`，零转码损耗、原画质帧率完整保留、数百兆视频瞬间导出；
- ✅ **需求 5（应用内置 FFmpeg）**：打包脚本将原生 FFmpeg 引擎直接内置至 `Contents/MacOS/ffmpeg`，用户免终端、免 Homebrew、开箱即用；
- ✅ **需求 6（使用附件提供的图片作为应用图标）**：已全局替换为附件图片，完全符合 macOS 现代图标规范；
- ✅ **需求 7（macOS .dmg 安装包，兼容苹果芯片与 Intel 芯片）**：采用 `swiftc` 分别编译 `arm64-apple-macosx11.0` 与 `x86_64-apple-macosx11.0`，并通过 `lipo` 合成 Universal 通用可执行文件，一键生成全机型通用的 `.dmg` 与 `.zip` 安装包。
- **去除冗余伪造交通灯**：原生 macOS 窗口已具备系统级红黄绿交通灯，移除了 Web 端自画的第二组红黄绿小圆点，在顶栏左侧预留 `pl-20`（80px）物理区域供原生交通灯自然呈现，彻底消除“窗口套窗口”的双重边框感；
- **支持原生窗口任意拖拽**：在顶部栏配置 `-webkit-app-region: drag`，按住顶部即可平滑拖动客户端视窗；
- **重构单层沉浸式工作台**：
  - 去除此前层层包裹的卡片边框（Hero 卡片套 DropZone 卡片套样例按钮等 7 层重叠边框）；
  - 未导入视频时：呈现一体化全幅拖拽画布与样例样片，纯粹干净；
  - 导入视频后：顶部为精炼视频规格条，中部为主控视屏播放与双滑块轨，底部为整合的一体化控制台（时间输入 + 保存路径预设 + 预计输出文件名 + 一键无损导出大按钮），层次分明无冗余套娃。

#### 4. GitHub Actions 手动构建新增「Pre-release 预发布」选项
- 在 `.github/workflows/build-dmg.yml` 的 `workflow_dispatch` 触发输入中增加 `prerelease` 布尔配置项（默认为 `false`）；
- 触发构建时可自由勾选是否将产物发布为 GitHub Releases 的 Pre-release 预发布版本，便于预览版本内测。

#### 5. 消除 GitHub Actions 构建中的 Node.js 20 弃用警告
- 针对 GitHub 官方关于 Runner 强制将 Node 20 actions 切换到 Node 24 产生的告警，在 Workflow 全局声明 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE20: true`；
- 将 `setup-node` 统一适配升级至 Node.js 22 LTS，确保 CI 流水线绿色无告警顺利执行。

#### 6. 原生安全进程防护与自定义保存路径
- **剪辑崩溃彻底根治**：原生 Cocoa 窗口接入 `NSDraggingDestination` 拖放通道获取源视频磁盘绝对路径，针对 `runBundledFFmpeg` 加入完整文件存在性校验、保存目录递归创建与管道异常拦截；
- **支持保存路径自定义**：提供「📁 源视频同一目录」、「🎬 影片 (~/Movies)」、「📥 下载 (~/Downloads)」、「🖥️ 桌面 (~/Desktop)」一键预设，并支持原生 `NSOpenPanel` 目录选取器及导出后「在访达中显示」。

---

### 📦 安装包构建与发布指南

1. **手动触发 GitHub Actions 构建**：
   - 进入 GitHub 仓库的 **Actions** 标签页；
   - 在左侧选择工作流 **「视频剪辑姬（Video Cutie）- macOS Universal DMG 构建与发布」**；
   - 点击右侧 **「Run workflow」**；
   - 可自定义版本号（如 `1.2.0`）、Release 标题，并可按需勾选 **「是否发布为 Pre-release 预发布版本」**；
   - 点击绿色 **Run workflow** 按钮启动构建。
2. **构建产物发布**：
   - 标题格式：`视频剪辑姬（Video Cutie）v1.2.0`；
   - 正文：自动包含本次优化完成汇报全文；
   - 包含 Universal 双架构磁盘映像 `VideoCutie-1.2.0-Universal.dmg` 与独立压缩包 `VideoCutie-1.2.0-macOS-Universal.zip`。
