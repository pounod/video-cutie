# 视频剪辑姬（Video Cutie）最新优化完成验收报告

### 🏷️ 软件基本信息
- **中文名称**：视频剪辑姬
- **英文名称**：Video Cutie
- **当前版本**：v1.2.3
- **运行平台**：macOS 11.0 Big Sur 及以上（全面支持 macOS 15+ Sequoia）
- **芯片架构**：Universal 通用双架构（原生同时兼容 Apple Silicon M1/M2/M3/M4 与 Intel x86_64）
- **客户端架构**：原生 macOS Cocoa + WebKit 独立桌面窗口程序（离线独立运行，零外部依赖）
- **内置引擎**：FFmpeg 原生二进制预打包至 `Contents/MacOS/ffmpeg`（无需安装终端，无需配置 Homebrew）
- **核心算法**：音视频流无损直接拷贝（`-c:v copy -c:a copy`）+ 毫秒级时间戳精准对齐（`-avoid_negative_ts make_zero`）

---

### 🚀 v1.2.3 核心优化与改动明细

#### 1. 每次完成需求后，自动将验收报告同步添加到 GitHub Actions Releases
- **自动化版本报告动态匹配**：
  - 在 `.github/workflows/build-dmg.yml` 中重构了 `release_notes` 抓取逻辑；
  - CI 在构建发布时，会首先根据当前构建版本号（如 `${APP_VERSION}`）智能查找对应的专属验收报告文件 `RELEASE_REPORT_v${APP_VERSION}.md`；
  - 若未找到则自动 fallback 至 `RELEASE_REPORT_LATEST.md`，保证无论通过 `workflow_dispatch` 手动触发还是通过 Git Tag 推送发布，GitHub Releases 中都能呈现最新、详尽、准确的优化完成验收报告；
  - 同步更新 GitHub Releases 默认标题为 `视频剪辑姬（Video Cutie）v1.2.3`，Tag 默认为 `v1.2.3`。

#### 2. GitHub README 页面全面升级
- **图标与客户端统一**：
  - 将 GitHub README 页面头部的产品 Logo 替换为与原生客户端一致的最新超清图标资源（`./public/app_icon.png`）；
  - 呈现精致的 macOS 质感几何剪辑 "V" 标，保持品牌与视觉认知高度一致。
- **去除固定版本锁定信息**：
  - 移除了 README 中硬编码的单一版本号（如 v1.2.0、Shields 徽标版本号等），将 README 定位为面向所有用户的长期稳定产品主页。
- **完善历次更新功能与产品介绍**：
  - 全面梳理并记录了视频剪辑姬的核心产品特性：原生 Cocoa+WebKit 架构、双架构通用 DMG、内置独立静态 FFmpeg Mach-O 引擎、极致无损流拷贝剪辑、智能时间输入自动补全（`012536` ➜ `01:25:36`）、原生目录授权与访达定位、跟随系统的自适应深浅色主题等。

#### 3. 客户端未加载视频时隐藏右侧滚动条
- **页面溢出控制优化**：
  - 在未加载视频的初始状态下，为 `document.documentElement` 和 `document.body` 动态锁定 `overflow: hidden`；
  - 调整根节点布局为 `h-screen overflow-hidden`，彻底消除了界面未加载视频时右侧多余且无意义的垂直滚动条，使视窗保持纯粹的 macOS 原生面板质感。

#### 4. 客户端未加载视频时去掉标题框下方重复显示的版本号
- **去除冗余版本标头**：
  - 优化初始欢迎界面（Hero 区域），删除了标题文字“视频剪辑姬 (Video Cutie)”下方多余的 `v1.2.x` 版本小标签；
  - 标题栏与系统菜单栏已有明确版本标识，去除重复展示，使界面视觉更加清爽纯粹。

#### 5. 全局版本号统一升级为 1.2.3
- 全面同步升级版本标识至 **v1.2.3**，覆盖以下关键文件：
  - `package.json`（version 及 build:dmg 命令）
  - `.github/workflows/build-dmg.yml`（默认版本号、Release 标题、Tag 标签与报告匹配器）
  - `src/utils/dmgGenerator.ts`（APP_INFO 元数据、Info.plist 模板及 GitHub Actions 嵌入配置）
  - `src-macos/main.swift`（原生客户端入口文件头部声明）
  - `scripts/build-dmg.sh`（通用 DMG 构建打包脚本）
  - `index.html`（网页 Title、OpenGraph 社交卡片与 Meta 描述）

---

### 📋 验收测试核对表

| 序号 | 需求项目 | 状态 | 验收说明 |
|:---:|:---|:---:|:---|
| 1 | 验收报告同步至 GitHub Actions Releases | ✅ 已通过 | 已在 Workflow 中实现动态检测 `RELEASE_REPORT_v${APP_VERSION}.md` / `RELEASE_REPORT_LATEST.md`，Releases 版本号更新为 1.2.3 |
| 2 | README 页面图标更新为与客户端相同 | ✅ 已通过 | README 顶部图片引用统一调整为 `./public/app_icon.png` |
| 3 | README 页面去掉具体版本信息并完善介绍 | ✅ 已通过 | 移除写死的版本号，整理历次版本核心技术特性与优势介绍 |
| 4 | 未加载视频时隐藏右边滚动条 | ✅ 已通过 | 锁定初始状态下的文档视口溢出样式，右侧滚动条彻底隐藏 |
| 5 | 未加载视频时去掉标题框下方重复版本号 | ✅ 已通过 | 移除 Hero 标题下的 `v1.2.2` 冗余 Badge |
| 6 | 全局应用版本号更新为 1.2.3 | ✅ 已通过 | package.json, yml, ts, swift, sh, html 全面升级同步 |

---

### 📦 安装包构建说明

在已连接 GitHub 仓库的环境下：
1. **GitHub Actions 自动化一键构建**：
   - 进入 GitHub 仓库页面，点击 **Actions** 标签；
   - 选择 **视频剪辑姬（Video Cutie）- macOS Universal DMG 构建与发布** 工作流；
   - 点击 **Run workflow**（默认版本号即为 `1.2.3`）；
   - 构建完成后，将自动生成 Universal 通用 DMG 并同步将本验收报告发布至 Releases。
2. **本地打包**（macOS 环境）：
   ```bash
   npm run build:dmg
   ```
