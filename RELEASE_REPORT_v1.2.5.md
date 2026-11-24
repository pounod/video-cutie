# 优化完成汇报（v1.2.5）

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.2.5
- **运行平台**：macOS 11.0 Big Sur 及以上（全面支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用双架构（原生同时兼容 Apple Silicon M1/M2/M3/M4 与 Intel x86_64）
- **客户端架构**：原生 macOS Cocoa + WebKit 独立桌面窗口程序（离线独立运行，零外部依赖）
- **内置引擎**：FFmpeg 原生二进制预打包至 `Contents/MacOS/ffmpeg`（无需安装终端，无需配置 Homebrew）
- **核心算法**：音视频流无损直接拷贝（`-c:v copy -c:a copy`）+ 毫秒级时间戳精准对齐（`-avoid_negative_ts make_zero`）

---

### 🚀 v1.2.5 核心优化与修复明细

#### 1. 修复顶部标题栏无法拖拽移动客户端窗口
- 在 `src-macos/main.swift` 中新增原生 `TitlebarDragView` 覆盖顶部标题栏区域（`x >= 76`，避开原生交通灯按钮），并启用 `window.isMovableByWindowBackground = true`；
- 在标题栏区域按下拖拽即可通过 `window?.performDrag(with: event)` 流畅移动窗口，双击标题栏支持原生缩放。

#### 2. 「关于 视频剪辑姬」改用标准 macOS 原生窗口与控件
- 将菜单栏“关于 视频剪辑姬”从网页模拟弹窗重构为纯正的 Cocoa 原生 `NSWindow`（`styleMask: [.titled, .closable, .miniaturizable, .resizable]`）；
- 界面内全部使用原生 AppKit 控件（`NSImageView`、`NSTextField`、`NSBox`、`NSStackView`），自动跟随系统深浅色模式；
- 移除右上角多余的关闭按钮，左上角原生红/黄/绿交通灯（关闭、最小化、最大化/缩放）及 `Cmd+W` 快捷键全部原生生效。

#### 3. 应用图标规范化缩放（对齐 macOS HIG 尺寸）
- 依据 Apple macOS 应用图标网格规范，将图标主体调整为 `824 × 824` 居中置于 `1024 × 1024` 透明画布（四周保留标准 100px 透明安全边距与柔和阴影），同步更新 `app_icon.png` 与 `AppIcon.icns`，使图标在 Dock 栏与访达中的视觉大小与系统其他应用一致。

#### 4. 全局版本号升级为 1.2.5
- 同步更新 `package.json`、`index.html`、`src/utils/dmgGenerator.ts`、`src-macos/main.swift`、`scripts/build-dmg.sh` 及 `.github/workflows/build-dmg.yml` 至 **v1.2.5**。
