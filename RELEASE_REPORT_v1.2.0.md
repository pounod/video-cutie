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

#### 1. 彻底根治「点击应用图标没有任何反应 / 无法启动」的严重 Bug
- **根因深度排查**：
  1. **编译器 Target Triple 拼写错误**：在 LLVM / Clang / Swift 编译器工具链规范中，macOS 的 target triple 标识符必须是 `macosx`（如 `arm64-apple-macosx11.0` 与 `x86_64-apple-macosx11.0`），此前写成 `macos` 导致 `swiftc` 抛出 `unrecognized target triple` 致命错误；
  2. **错误吞没与空脚本秒退**：编译语句末尾的 `|| true` 掩盖了编译失败，导致未能生成原生二进制产物，进而触发回退分支写入了一段仅输出文本的 Shell 脚本；当用户双击 `.app` 时，系统执行该脚本并在 0.001 秒内直接执行完毕退出，表现为**点击图标没有任何反应**；
  3. **WebKit 私有 KVC 属性致命崩溃**：在 macOS 14/15 系统中，WebKit 移除了未公开的私有键 `allowFileAccessFromFileURLs`，调用 `setValue(_:forKey:)` 会直接抛出无法被 Swift 捕获的 Objective-C `NSUnknownKeyException` 异常，导致应用在窗口绘制前即时崩溃闪退；
  4. **AppDelegate 生命周期提前释放**：Cocoa 原生主循环中 `app.delegate` 属于弱引用，若无显式生命周期保护可能在垃圾回收时被提前释放。
- **全方位加固方案**：
  1. 纠正 `build-dmg.sh` 中的 target triple 为标准 `-target arm64-apple-macosx11.0` 与 `-target x86_64-apple-macosx11.0`，并加入宿主本地默认架构直编兜底；
  2. 在 CI 构建脚本中设置严格门禁：在 macOS 环境下若原生视窗程序编译未生成二进制，立即阻断并打印详细日志，严禁生成损坏安装包；
  3. 彻底移除 WebKit 私有 KVC 注入，全面采用 Apple 官方推荐的标准 `loadFileURL(indexURL, allowingReadAccessTo: accessURL)` 授权加载机制，完美兼容 macOS 11 至 macOS 15+ Sequoia；
  4. 采用 `withExtendedLifetime(strongDelegate)` 强引用锁定 Cocoa 代理生命周期，杜绝提前释放。

#### 2. 全新应用图标替换（完全采纳用户附件设计）
- **图标更新**：将应用整体图标更换为用户附件提供的全新设计（斜向精准剪刀裁切胶片画卷、带播放三角指示、柔和渐变圆角平底风格）；
- **全端同步覆盖**：
  - 更新前端桌面视窗左上角小图标与主界面拖拽区大图标（`src/assets/app_icon.png` 与 `public/app_icon.png`）；
  - 更新 GitHub `README.md` 顶端展示图标；
  - 重新打包生成完整的 macOS 视网膜 `AppIcon.icns`（内置 16x16、32x32、64x64、128x128、256x256、512x512、1024x1024 完整层级图标集）；
  - 在 CI 流程中联动 `sips` 与 `iconutil` 确保每次 DMG 打包均采用该标准附件图标。

#### 3. 彻底解决客户端界面「多层嵌套」视觉问题
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
