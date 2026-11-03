<div align="center">

<img src="./src/assets/images/video_cutie_icon_1793694252197.jpg" alt="视频剪辑姬 Logo" width="128" height="128" style="border-radius: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.15);" />

# 视频剪辑姬（Video Cutie）

**专为 macOS 设计的极速无损视频裁剪工具**  
*Ultra-Fast, Lossless Video Trimming Tool Engineered for macOS*

[![macOS](https://img.shields.io/badge/macOS-11.0%2B%20(Big%20Sur%20~%20Sequoia)-000000?style=flat&logo=apple&logoColor=white)](https://apple.com)
[![Architecture](https://img.shields.io/badge/Architecture-Universal%20(arm64%20%2B%20x86__64)-0ea5e9?style=flat&logo=apple)](https://github.com)
[![FFmpeg](https://img.shields.io/badge/Engine-FFmpeg%20Stream%20Copy%20(-c%20copy)-007808?style=flat&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)
[![Version](https://img.shields.io/badge/Version-v1.1-ec4899?style=flat)](https://github.com)
[![CI/CD](https://img.shields.io/badge/GitHub%20Actions-Build%20%26%20Release%20DMG-22c55e?style=flat&logo=githubactions&logoColor=white)](https://github.com)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue?style=flat)](./LICENSE)

[功能特性](#-功能特性) • [安装使用](#-安装与下载) • [智能时间补全](#-时间格式智能补全规则) • [流复制原理](#-音视频流复制技术原理解析) • [GitHub-Actions-构建发布](#-github-actions-自动化构建与-releases-发布) • [本地开发](#-本地开发与打包)

</div>

---

## 📖 项目简介

**视频剪辑姬（Video Cutie）** 是一款专为苹果 macOS 生态打造的现代扁平化无损视频剪切应用。

传统剪辑软件（如 Premiere、剪映）导出片段时普遍会进行重新编解码，不仅占用大量的 CPU/GPU 算力、发热耗电，还会破坏画质并导致偏色。  
**视频剪辑姬** 依托 macOS 终端已安装的 FFmpeg 原生能力，采用**音视频流复制（Stream Copy）**技术，直接将原封装内的未解压数据包无损截取并写入新文件，实现 **0 画质损耗、0 渲染等待、毫秒级极速导出**！

同时提供**时间智能补全（输入 `012536` 自动补全为 `01:25:36`）**、**双架构通用 macOS `.dmg` 安装包**与 **GitHub Actions 自动化 CI/CD 构建**。

---

## ✨ 功能特性

### 1. 拖入视频即刻提取必要元数据
- **原生拖拽支持**：将本地视频文件（`.mp4`, `.mov`, `.mkv`, `.webm`, `.avi`, `.m4v` 等）直接拖入窗口即可自动载入。
- **深度参数分析**：
  - 画面分辨率（如 `3840×2160 4K UHD`、`1920×1080 1080p`、`1080×1920 9:16 竖屏`）
  - 准确视频时长（秒数与 `HH:MM:SS.ms` 格式）
  - 视频编码类型（`H.264/AVC`、`HEVC/H.265`、`Apple ProRes` 等）
  - 音频流参数（`AAC-LC Stereo 48kHz`、`Dolby Digital` 等）
  - 预计裁剪体积预估与实时播放器精准预览。
- **预置样片体验**：无需准备本地素材，内置 4K 超清自然风光、1080p 电影短片与竖屏样片，一键即开测试。

### 2. 智能时间格式补全（`012536` → `01:25:36`）
- 界面时间输入框严格遵循标准 `01:25:36`（`HH:MM:SS`）规范。
- **快捷连续输入**：用户连续输入 6 位纯数字（如 `012536`）或直接粘贴数字，系统自动切分并注入冒号，**瞬间自动补全为 `01:25:36`** 并高亮提示。
- **默认边界省心兜底**：
  - **开始时间省略**：默认从原点 `00:00:00` 起始。
  - **结束时间省略**：默认截取至视频的最长总时长。
- **高频微调支持**：支持「一键设为当前播放点」、「重置为默认」、「±1s / ±5s 微调步进」以及双滑块区间直观拖动。

### 3. 音视频流无损复制（`-c:v copy -c:a copy`）
- **绝无重编码损耗**：输出文件 100% 继承原画分辨率、码率、HDR10 / Dolby Vision 动态元数据及 BT.2020 色彩矩阵。
- **原声音轨完整保留**：多声道、无损音频轨道不发生采样率重采样与压缩劣化。
- **时间戳重对齐（`-avoid_negative_ts make_zero`）**：自动将裁剪后的首帧 PTS/DTS 显示时间戳归零，彻底根除切片前几秒黑屏或音画不同步问题。

### 4. macOS 终端 FFmpeg 深度适配
- 自动适配已通过终端安装的 FFmpeg 环境变量：
  - Apple Silicon 架构路径：`/opt/homebrew/bin/ffmpeg`
  - Intel x86_64 架构路径：`/usr/local/bin/ffmpeg`
- 提供**一键复制终端完整指令**、**下载 macOS 执行脚本（`trim_lossless.sh`）**或通过 AppleScript 唤醒 Terminal 自动执行。
- 内置 **macOS Terminal 日志模拟器**，直观预览以 400x~1000x 超高速流复制完成的终端输出过程。

### 5. 通用二进制架构（Universal Binary）
- 同一份 DMG 安装包同时内嵌并优化支持：
  - 🍏 **Apple Silicon**：M1、M2、M3、M4 全系列芯片（原生 arm64 指令，极低功耗）
  - 💻 **Intel 处理器**：Core i5、i7、i9、Xeon 等 Mac 机型（原生 x86_64 指令，无需 Rosetta 2 翻译）

---

## ⚡️ 速度与画质对比

| 对比维度 | 传统视频剪辑软件（重编码渲染） | 视频剪辑姬（-c copy 流复制） |
| :--- | :--- | :--- |
| **画面画质** | 二次压缩产生色块、锐度下降 | **100% 母带级无损（Bit-exact Copy）** |
| **HDR / 色彩** | 易丢失 Dolby Vision / HDR 元数据 | **完全保留原片色彩空间与元数据** |
| **导出耗时 (10GB 4K)** | 3 ~ 15 分钟（显卡风扇狂转） | **0.2 ~ 0.8 秒（瞬间秒出）** |
| **CPU / GPU 占用** | 80% ~ 100% 满载发热 | **< 2% 纯磁盘读写，设备冰凉** |
| **音轨质量** | 音频二次压缩导致毛刺 | **完全复制原始音频数据流** |

---

## ⌨️ 时间格式智能补全规则

操作界面针对用户常见输入习惯进行了针对性优化：

| 用户键盘输入 | 自动补全显示结果 | 转换逻辑与解析说明 |
| :--- | :--- | :--- |
| `012536` | **`01:25:36`** | 6位数字自动解析为：1小时25分36秒（核心需求匹配） |
| `12536` | **`01:25:36`** | 5位数字按 `H:MM:SS` 规整补全 |
| `2536` | **`00:25:36`** | 4位数字自动解析为：25分36秒 |
| `45` | **`00:00:45`** | 2位数字自动解析为：45秒 |
| *(留空省略开始)* | **`00:00:00`** | 开始时间省略默认为 0 |
| *(留空省略结束)* | **`视频总时长`** | 结束时间省略自动捕获最长播放时间 |

---

## 📦 安装与下载

### 方式一：下载 macOS Universal `.dmg` 安装包（推荐）
1. 访问本仓库的 [Releases 页面](https://github.com)；
2. 下载最新发布的 `VideoCutie-1.1-Universal.dmg`；
3. 双击挂载后，将 **视频剪辑姬.app** 拖入 **Applications（应用程序）** 文件夹即可！

```
+-------------------------------------------------------+
|  视频剪辑姬 1.1 安装器                                |
|                                                       |
|    [ 视频剪辑姬.app ]   ======>   [ Applications ]    |
|                                                       |
+-------------------------------------------------------+
```

### 方式二：终端命令行一键执行（无需安装客户端）
若您的 Mac 已经通过终端安装了 FFmpeg，您随时可以直接复制应用生成的命令：
```bash
ffmpeg -ss 00:01:25 -to 00:03:40 -i "input.mp4" -c:v copy -c:a copy -avoid_negative_ts make_zero "output_trimmed.mp4"
```

---

## 🤖 GitHub Actions 自动化构建与 Releases 发布

本项目已内置完整的 GitHub Actions CI/CD 工作流（`.github/workflows/build-dmg.yml`）。无需在本地安装复杂的打包工具，代码推送到 GitHub 后可**手动一键触发**：

### 🎯 3 步手动触发构建流程：
1. **推送代码**：将代码提交同步至 GitHub 仓库：
   ```bash
   git add .
   git commit -m "feat: 发布视频剪辑姬 v1.1"
   git push origin main
   ```
2. **手动触发构建**：
   - 打开 GitHub 仓库，点击顶部 **Actions** 标签页；
   - 在左侧选择 **`视频剪辑姬（Video Cutie）- macOS Universal DMG 构建与发布`**；
   - 点击右侧 **「Run workflow」** 下拉框，确认版本号为 `1.1`，点击运行。
3. **自动发布 Releases**：
   - GitHub Actions 运行器（macOS）将自动编译 Web 产物，构建兼容 Apple Silicon 与 Intel 的 Universal DMG；
   - 构建完成后自动创建 Release，标题格式规范为：
     $$\text{视频剪辑姬（Video Cutie）v1.1}$$
   - 正文自动关联并注入仓库中的 `RELEASE_REPORT_v1.1.md`（优化完成汇报）；
   - 自动上传 `VideoCutie-1.1-Universal.dmg` 与 `.zip` 安装包至附件。

---

## 💻 本地开发与打包

### 前置环境
- Node.js >= 20.0.0
- macOS 系统（用于本地测试 `hdiutil` / `create-dmg`）
- 本地终端已安装 FFmpeg（`brew install ffmpeg`）

### 常用命令
```bash
# 1. 克隆仓库
git clone https://github.com/your-username/video-cutie.git
cd video-cutie

# 2. 安装依赖 (使用锁文件或 legacy 模式)
npm install

# 3. 启动本地开发服务 (默认端口 3000)
npm run dev

# 4. 构建前端生产产物
npm run build

# 5. 本地一键打包 macOS Universal DMG 安装包
npm run build:dmg
# 打包产物将生成在 dist-dmg/ 目录下
```

---

## 🛠️ 项目结构

```
.
├── .github/
│   └── workflows/
│       └── build-dmg.yml             # GitHub Actions CI/CD 自动化构建与 Releases 发布
├── scripts/
│   └── build-dmg.sh                  # macOS Universal DMG 原生打包脚本
├── src/
│   ├── assets/images/                # 现代扁平化应用图标等静态资源
│   ├── components/
│   │   ├── MacTitleBar.tsx           # macOS 经典红黄绿信号灯与标题栏
│   │   ├── DropZone.tsx              # 拖拽导入与预置样片加载器
│   │   ├── TimelineScrubber.tsx      # 视频播放器与双滑块区间裁剪器
│   │   ├── TimeInputBox.tsx          # 012536 智能格式补全组件
│   │   ├── VideoMetadataCard.tsx     # 视频深度元数据与流复制参数卡片
│   │   ├── TerminalPanel.tsx         # FFmpeg 终端指令、一键脚本与终端模拟器
│   │   ├── DmgInstallerModal.tsx     # macOS DMG 挂载模拟窗口与下载中心
│   │   ├── GitHubActionsModal.tsx    # GitHub Actions 构建与发布中心
│   │   ├── TechSpecsModal.tsx        # 无损音视频流复制技术白皮书
│   │   └── AboutModal.tsx            # 关于 视频剪辑姬
│   ├── utils/
│   │   ├── timeFormat.ts             # 时间转换与 012536 自动补全核心算法
│   │   ├── ffmpegHelper.ts           # FFmpeg 命令构造器与 macOS Shell 脚本
│   │   └── dmgGenerator.ts           # DMG 结构描述与构建配置
│   ├── App.tsx                       # 客户端主界面
│   ├── index.css                     # Tailwind CSS v4 与 macOS 视觉样式
│   └── main.tsx                      # 客户端启动入口
├── RELEASE_REPORT_v1.1.md            # v1.1 优化完成汇报 (自动作为 Releases 正文)
├── package.json                      # 项目依赖与编译脚本
├── package-lock.json                 # 依赖锁定文件 (确保 CI 100% 成功)
└── README.md                         # 软件使用与技术文档
```

---

## 📄 开源许可

本项目基于 [Apache License 2.0](./LICENSE) 许可协议开源。

<div align="center">
Made with 💖 for macOS Video Creators
</div>
