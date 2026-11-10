# 视频剪辑姬 (Video Cutie)

<div align="center">
  <img src="public/app_icon.png" width="128" height="128" alt="视频剪辑姬 App Icon" style="border-radius: 28px;" />
  <h3>专为 macOS 设计的原生极简无损视频剪辑客户端</h3>
  <p><b>内置 FFmpeg 引擎 · 零终端命令 · 毫秒级流复制无损裁剪 · 智能时间格式补全</b></p>
  <p>
    <img src="https://img.shields.io/badge/Platform-macOS%2011.0%2B-blue.svg" alt="Platform macOS" />
    <img src="https://img.shields.io/badge/Arch-Universal%20(arm64%2Bx86__64)-success.svg" alt="Universal Binary" />
    <img src="https://img.shields.io/badge/Engine-Bundled%20FFmpeg-orange.svg" alt="Bundled FFmpeg" />
    <img src="https://img.shields.io/badge/License-All%20Rights%20Reserved-ff69b4.svg" alt="License" />
  </p>
</div>

---

## 🎬 产品介绍

**视频剪辑姬（Video Cutie）** 是一款专为苹果 macOS 系统量身定制的高性能视频无损裁剪桌面客户端。软件摒弃了传统视频剪辑软件臃肿繁杂的轨道时间线与转码等待，聚焦于“**拖入视频 → 设定时间 → 瞬间导出**”的核心诉求，以极简的原生单页视窗提供毫秒级无损裁剪体验。

应用内置预打包的 Universal 双架构 FFmpeg 原生引擎，普通用户无需打开终端窗口、无需安装配置 Homebrew 环境，开箱即用，原画质秒速导出。

---

## ✨ 核心特色与功能

1. **原生 Cocoa 视窗客户端**：
   - 采用 WebKit 现代内核 + Swift 原生桥接架构，彻底杜绝传统网页跨域限制与白屏问题，秒开秒用；
   - 原生支持 macOS 系统级窗口拖拽、深色与浅色外观自动平滑跟随切换。

2. **全幅超大拖拽画布**：
   - 打开客户端即可直面超大感应放置区，随手拖入视频文件即可毫秒级解析；
   - 全面兼容 MP4, MOV, MKV, WebM, M4V, TS, AVI 等主流音视频容器格式。

3. **双架构内置 FFmpeg 原生引擎**：
   - 客户端内部嵌入真正的 Universal Mach-O (arm64 + x86_64) 二进制引擎；
   - 无论是 Apple Silicon 芯片（M1/M2/M3/M4）还是 Intel 芯片的 Mac 电脑，均以本地硬件原生速度运行，彻底根治 CPU 架构不匹配错误。

4. **原画音视频流复制无损裁剪（-c copy）**：
   - 采用音视频数据包直接拷贝算法（Stream Copy），无需经历二次编解码过程；
   - 100% 保持原视频的原始分辨率、HDR色彩、帧率、码率及音轨参数，数百兆甚至数千兆的高清视频 1 秒内完成裁剪。

5. **智能时间格式快速补全**：
   - 支持直观输入如 `012536`，系统毫秒级智能自动补全格式化为标准时间格式 `01:25:36` 并即时呈现；
   - 开始时间与结束时间省略时，自动默认以 `00:00:00` 开始并裁剪至视频播放结束。

6. **持久保存路径与 macOS 权限管控**：
   - 界面直观显示并记忆当前设定的保存路径，只要不主动修改则永久持续生效；
   - 支持原生 macOS 访达文件夹授权申请与目录选择，裁剪完成后支持“在访达中显示”快速定位文件。

7. **专注纯粹的交互体验**：
   - 去除所有冗余标签页、手动切换按钮与杂乱文字，当未加载视频时自动隐去滚动条保持浑然一体；
   - 提供鲜明的“一键无损剪辑导出”核心操作按钮与快捷“清空视频”入口。

8. **标准现代 macOS 图标规范**：
   - 遵循 Apple Human Interface Guidelines，采用纯净圆角矩形 Retina 拟物渐变图标，无黑边、无字符。

---

## 🚀 GitHub Actions 自动构建与发布

本仓库已配置高度优化的自动化 CI/CD 工作流（`.github/workflows/build-dmg.yml`）：
- 触发构建时，GitHub 运行器将全自动合成 Universal 静态 FFmpeg 引擎，并使用 `swiftc` 交叉编译生成双架构原生客户端；
- 自动生成同时兼容 Apple Silicon 与 Intel 双架构芯片的 `.dmg` 磁盘映像安装包；
- 每次完成构建后，自动提取最新的**项目验收优化报告**作为 Release Notes，发布至 GitHub Releases 页面供直接下载使用。

---

## 💻 本地开发与构建

```bash
# 1. 安装项目依赖
npm install

# 2. 启动本地开发预览
npm run dev

# 3. 编译 Web 客户端资源
npm run build

# 4. 在 macOS 终端下一键打包生成 Universal DMG
npm run build:dmg
```

---

## 📄 License
Copyright © 2026 视频剪辑姬 (Video Cutie). All rights reserved.
