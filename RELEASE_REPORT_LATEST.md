# 视频剪辑姬（Video Cutie）最新优化完成验收报告

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
- 新增原生 `TitlebarDragView` 覆盖顶部标题栏区域（避开左上角交通灯按钮），支持拖拽移动窗口及双击标题栏缩放。

#### 2. 「关于 视频剪辑姬」改用标准 macOS 原生窗口与控件
- 使用原生 Cocoa `NSWindow` 与标准 AppKit 控件（`NSImageView`、`NSTextField`、`NSBox`、`NSStackView`）重构关于窗口，移除右上角多余关闭按钮，左上角关闭、最小化、最大化功能全部原生可用。

#### 3. 应用图标尺寸对齐系统其他应用
- 按照 Apple macOS Big Sur+ 图标网格标准，将 `app_icon.png` 与 `AppIcon.icns` 调整为 `1024 × 1024` 画布内居中 `824 × 824` 主体与标准安全边距，消除在 Dock 与访达中偏大的问题。

#### 4. 全局版本号升级为 1.2.5
- 全面同步更新至 **v1.2.5**（涵盖 `package.json`、`index.html`、`src/utils/dmgGenerator.ts`、`src-macos/main.swift`、`scripts/build-dmg.sh` 及 `.github/workflows/build-dmg.yml`）。
