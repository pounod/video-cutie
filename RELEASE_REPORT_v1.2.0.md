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

#### 1. 修复应用图标持续跳动无法启动、或启动后打开浏览器页面的严重 Bug
- **根因分析**：
  1. 此前在 CI 构建脚本中，调用 `swiftc` 编译原生 Cocoa 客户端时误传了 `-framework Cocoa -framework WebKit` 编译参数（Swift 模块通过 `import` 自动解析，直接传参导致 `swiftc: error: unknown argument`），且未传递 macOS SDK 路径；
  2. 因编译指令失败后被捕获降级，触发了向可执行文件写入启动本地 HTTP 服务并调用 `open http://...` 浏览器页面的回退脚本；该脚本非 Cocoa 视窗程序，未向 macOS WindowServer 注册握手，导致 macOS Dock 图标长时间持续跳动、最终打开浏览器而非原生客户端；
  3. 未对生成的 `.app` 实施 `codesign` 代码签名，在 Apple Silicon (M1~M4) 上因 AMFI 安全策略直接遭系统拦截。
- **全面加固与解决**：
  1. 重构 `build-dmg.sh` 编译链：通过 `xcrun --show-sdk-path` 准确绑定 macOS SDK，修复 `swiftc` 模块参数；
  2. 针对 Apple Silicon（arm64）与 Intel（x86_64）双架构分别生成并由 `lipo` 合成 Universal 原生独立可执行文件；
  3. 构建最后一步调用 `codesign --force --deep --sign -` 进行本地代码签名，确保双击秒开、绝不跳动阻断或跳出浏览器。

#### 2. 彻底解决客户端界面「多层嵌套」视觉问题
- **去除冗余伪造交通灯**：原生 macOS 窗口已具备系统级红黄绿交通灯，移除了 Web 端自画的第二组红黄绿小圆点，在顶栏左侧预留 `pl-20`（80px）物理区域供原生交通灯自然呈现，彻底消除“窗口套窗口”的双重边框感；
- **支持原生窗口任意拖拽**：在顶部栏配置 `-webkit-app-region: drag`，按住顶部即可平滑拖动客户端视窗；
- **重构单层沉浸式工作台**：
  - 去除此前层层包裹的卡片边框（Hero 卡片套 DropZone 卡片套样例按钮等 7 层重叠边框）；
  - 未导入视频时：呈现一体化全幅拖拽画布与样例样片，纯粹干净；
  - 导入视频后：顶部为精炼视频规格条，中部为主控视屏播放与双滑块轨，底部为整合的一体化控制台（时间输入 + 保存路径预设 + 预计输出文件名 + 一键无损导出大按钮），层次分明无冗余套娃。

#### 3. GitHub Actions 手动构建新增「Pre-release 预发布」选项
- 在 `.github/workflows/build-dmg.yml` 的 `workflow_dispatch` 触发输入中增加 `prerelease` 布尔配置项（默认为 `false`）；
- 触发构建时可自由勾选是否将产物发布为 GitHub Releases 的 Pre-release 预发布版本，便于预览版本内测。

#### 4. 消除 GitHub Actions 构建中的 Node.js 20 弃用警告
- 针对 GitHub 官方关于 Runner 强制将 Node 20 actions 切换到 Node 24 产生的告警，在 Workflow 全局声明 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE20: true`；
- 将 `setup-node` 统一适配升级至 Node.js 22 LTS，确保 CI 流水线绿色无告警顺利执行。

#### 5. 原生安全进程防护与自定义保存路径
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
