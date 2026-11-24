# 视频剪辑姬（Video Cutie）最新优化完成验收报告

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.2.4
- **运行平台**：macOS 11.0 Big Sur 及以上（全面支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用双架构（原生同时兼容 Apple Silicon M1/M2/M3/M4 与 Intel x86_64）
- **客户端架构**：原生 macOS Cocoa + WebKit 独立桌面窗口程序（离线独立运行，零外部依赖）
- **内置引擎**：FFmpeg 原生二进制预打包至 `Contents/MacOS/ffmpeg`（无需安装终端，无需配置 Homebrew）
- **核心算法**：音视频流无损直接拷贝（`-c:v copy -c:a copy`）+ 毫秒级时间戳精准对齐（`-avoid_negative_ts make_zero`）

---

### 🚀 v1.2.4 核心优化与改动明细

#### 1. 客户端初始窗口与界面尺寸优化为一般大小
- 将原生 macOS 窗口默认尺寸调整为 `900 × 620`（自适应屏幕可视区域），最小尺寸调整为 `720 × 500`。
- 主工作区收敛至 `max-w-4xl`，空状态拖拽画布居中呈现且不再全屏拉伸，视频预览区最大高度调整为 `340px`。

#### 2. 清理客户端界面中重复展示的功能与提示
- 去除初始界面与顶部标题栏重复的应用图标、名称及副标题区块。
- 将保存路径栏中重复的多个权限申请按钮整合为单一按钮，并简化重复的路径说明文字。
- 移除视频预览画面上重复的文件名与裁剪区间浮层、双时间输入框中重复的演示按钮，以及底部重复展示的无损流复制横幅。

#### 3. 全局版本号升级为 1.2.4
- 全面同步更新至 **v1.2.4**（涵盖 `package.json`、`index.html`、`src/utils/dmgGenerator.ts`、`src-macos/main.swift`、`scripts/build-dmg.sh` 及 `.github/workflows/build-dmg.yml`）。
