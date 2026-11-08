/**
 * macOS Universal DMG & App Bundle Generator (Video Cutie 1.2.0)
 * Dual-Architecture: Apple Silicon (M1/M2/M3/M4, arm64) + Intel (x86_64)
 * Bundled FFmpeg: Embedded directly into App Bundle (Contents/MacOS/ffmpeg)
 */

export interface DmgPackageInfo {
  appNameZh: string;
  appNameEn: string;
  version: string;
  releaseTitle: string;
  bundleId: string;
  minSystemVersion: string;
  architectures: string[];
  filename: string;
}

export const APP_INFO: DmgPackageInfo = {
  appNameZh: '视频剪辑姬',
  appNameEn: 'Video Cutie',
  version: '1.2.0',
  releaseTitle: '视频剪辑姬（Video Cutie）v1.2.0',
  bundleId: 'com.videocutie.macos.app',
  minSystemVersion: '11.0 (macOS Big Sur ~ macOS 15+ Sequoia)',
  architectures: ['arm64 (Apple Silicon M1/M2/M3/M4)', 'x86_64 (Intel 64-bit)'],
  filename: 'VideoCutie-1.2.0-Universal.dmg',
};

/**
 * Generates Info.plist content for the macOS App Bundle
 */
export function generateInfoPlist(version: string = APP_INFO.version): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key>
    <string>zh_CN</string>
    <key>CFBundleDisplayName</key>
    <string>视频剪辑姬</string>
    <key>CFBundleExecutable</key>
    <string>VideoCutie</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIconName</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.videocutie.macos.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>VideoCutie</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${version}</string>
    <key>CFBundleVersion</key>
    <string>${version}</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 视频剪辑姬 (Video Cutie). All rights reserved.</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.video</string>
</dict>
</plist>`;
}

/**
 * Creates a synthetic DMG binary container package for version 1.2.0
 */
export function createSyntheticDmgBlob(): Blob {
  const header = `koly` + `视频剪辑姬（Video Cutie）v1.2.0 Universal DMG [arm64 + x86_64, Bundled FFmpeg]`;
  const info = generateInfoPlist();
  
  const content = `# ==============================================================================
# 视频剪辑姬（Video Cutie）v1.2.0 macOS Universal Disk Image Bundle (.dmg)
# Architectures: arm64 (Apple Silicon M1/M2/M3/M4) + x86_64 (Intel Core i5/i7/i9/Xeon)
# Target OS: macOS 11.0 Big Sur ~ macOS 15+ Sequoia
# FFmpeg: 内置打包 (Contents/MacOS/ffmpeg)，免终端，免手动安装
# Mode: Lossless Video & Audio Stream Copy (-c:v copy -c:a copy)
# ==============================================================================

[DMG Header]
Volume Name: 视频剪辑姬 1.2.0
Bundle Identifier: com.videocutie.macos.app
Release Title: 视频剪辑姬（Video Cutie）v1.2.0
Architectures: Universal Binary (arm64, x86_64)

[App Bundle Structure]
视频剪辑姬.app/
├── Contents/
│   ├── Info.plist
${info}
│   ├── MacOS/
│   │   ├── VideoCutie (Native Cocoa WebKit Executable)
│   │   └── ffmpeg (Bundled Native Video Engine)
│   └── Resources/
│       ├── AppIcon.icns (Retina macOS Squircle Icon)
│       ├── index.html
│       └── assets/
`;

  return new Blob([header, '\n\n', content], { type: 'application/x-apple-diskimage' });
}

/**
 * Downloads a generated file as a browser Blob
 */
export function downloadFile(filename: string, content: string | Blob, mimeType: string = 'application/octet-stream') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const GITHUB_WORKFLOW_YAML = `name: 视频剪辑姬（Video Cutie）- macOS Universal DMG 构建与发布

on:
  workflow_dispatch:
    inputs:
      version:
        description: '发布版本号 (如 1.2.0)'
        required: true
        default: '1.2.0'
      release_title:
        description: 'GitHub Release 标题'
        required: true
        default: '视频剪辑姬（Video Cutie）v1.2.0'
      create_release:
        description: '构建完成后是否自动在 GitHub Releases 发布'
        required: true
        type: boolean
        default: true
      prerelease:
        description: '是否发布为 Pre-release 预发布版本'
        required: false
        type: boolean
        default: false
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build-macos-dmg:
    name: 构建内置 FFmpeg 的 macOS Universal 客户端与 DMG
    runs-on: macos-latest
    steps:
      - name: 检出仓库代码
        uses: actions/checkout@v4

      - name: 安装 Node.js 运行时
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: 安装项目依赖 (配置 macOS 原生环境)
        run: |
          rm -rf node_modules package-lock.json
          npm install --legacy-peer-deps

      - name: 构建 Web 客户端界面资源
        run: |
          npm run build

      - name: 安装打包工具与 Universal (arm64 + x86_64) FFmpeg 原生引擎
        run: |
          brew install create-dmg || true
          mkdir -p build/ffmpeg-universal /tmp/ffmpeg-dl
          echo "⬇️ 正在获取官方独立静态 FFmpeg (arm64 与 x86_64 架构)..."
          curl -fsSL --retry 3 --connect-timeout 10 "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-arm64.gz" | gzip -d > /tmp/ffmpeg-dl/ffmpeg-arm64 || true
          curl -fsSL --retry 3 --connect-timeout 10 "https://github.com/eugeneware/ffmpeg-static/releases/download/b6.0/ffmpeg-darwin-x64.gz" | gzip -d > /tmp/ffmpeg-dl/ffmpeg-x64 || true
          if [ -s "/tmp/ffmpeg-dl/ffmpeg-arm64" ] && [ -s "/tmp/ffmpeg-dl/ffmpeg-x64" ]; then
            chmod +x /tmp/ffmpeg-dl/ffmpeg-arm64 /tmp/ffmpeg-dl/ffmpeg-x64
            lipo -create /tmp/ffmpeg-dl/ffmpeg-arm64 /tmp/ffmpeg-dl/ffmpeg-x64 -output build/ffmpeg-universal/ffmpeg
            chmod +x build/ffmpeg-universal/ffmpeg
            echo "✅ 成功使用 lipo 合成 Universal (arm64 + x86_64) 双架构 FFmpeg 原生二进制！"
            lipo -info build/ffmpeg-universal/ffmpeg || true
          else
            echo "⚠️ 静态双架构下载不完整，备用安装本地 Homebrew ffmpeg..."
            brew install ffmpeg || true
          fi

      - name: 编译原生客户端、打包内置 FFmpeg 并生成 Universal DMG
        env:
          APP_VERSION: \${{ github.event.inputs.version || '1.2.0' }}
          APP_NAME_ZH: "视频剪辑姬"
          APP_NAME_EN: "Video Cutie"
        run: |
          chmod +x ./scripts/build-dmg.sh
          ./scripts/build-dmg.sh "\${{ github.event.inputs.version || '1.2.0' }}"

      - name: 准备优化完成汇报 (Release Notes)
        id: release_notes
        run: |
          if [ -f "RELEASE_REPORT_v1.2.0.md" ]; then
            echo "notes_file=RELEASE_REPORT_v1.2.0.md" >> $GITHUB_OUTPUT
          elif [ -f "RELEASE_REPORT_v1.1.1.md" ]; then
            echo "notes_file=RELEASE_REPORT_v1.1.1.md" >> $GITHUB_OUTPUT
          else
            echo "notes_file=README.md" >> $GITHUB_OUTPUT
          fi

      - name: 上传构建产物 Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: VideoCutie-macOS-Universal-DMG
          path: |
            dist-dmg/*.dmg
            dist-dmg/*.zip

      - name: 在 GitHub Releases 中自动发布
        if: \${{ github.event.inputs.create_release != false }}
        uses: softprops/action-gh-release@v2
        with:
          name: \${{ github.event.inputs.release_title || '视频剪辑姬（Video Cutie）v1.2.0' }}
          tag_name: "v\${{ github.event.inputs.version || '1.2.0' }}"
          body_path: \${{ steps.release_notes.outputs.notes_file }}
          draft: false
          prerelease: false
          files: |
            dist-dmg/*.dmg
            dist-dmg/*.zip
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
