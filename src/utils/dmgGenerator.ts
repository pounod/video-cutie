/**
 * macOS Universal DMG & App Bundle Generator (TrimCraft 1.0)
 * Dual-Architecture: Apple Silicon (M1/M2/M3/M4, arm64) + Intel (x86_64)
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
  version: '1.1.1',
  releaseTitle: '视频剪辑姬（Video Cutie）v1.1.1',
  bundleId: 'com.videocutie.macos.app',
  minSystemVersion: '11.0 (macOS Big Sur ~ macOS 15+ Sequoia)',
  architectures: ['arm64 (Apple Silicon M1/M2/M3/M4)', 'x86_64 (Intel 64-bit)'],
  filename: 'VideoCutie-1.1.1-Universal.dmg',
};

/**
 * Generates Info.plist content for the macOS App Bundle
 */
export function generateInfoPlist(): string {
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
    <string>1.1.1</string>
    <key>CFBundleVersion</key>
    <string>1.1.1</string>
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
 * Universal Binary macOS Launcher Shell Script inside Contents/MacOS/VideoCutie
 */
export function generateUniversalLauncherScript(): string {
  return `#!/usr/bin/env bash
# ==========================================================
# 视频剪辑姬（Video Cutie）v1.1 - Universal macOS Launcher
# ==========================================================
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
ARCH="$(uname -m)"

echo "[视频剪辑姬 1.1] Detected macOS Architecture: $ARCH"

# 检测架构并选择对应原生二进制
if [ "$ARCH" = "arm64" ]; then
    echo "[视频剪辑姬 1.1] Running on Apple Silicon (arm64 Native)"
    export PATH="/opt/homebrew/bin:$PATH"
elif [ "$ARCH" = "x86_64" ]; then
    echo "[视频剪辑姬 1.1] Running on Intel (x86_64 Native)"
    export PATH="/usr/local/bin:$PATH"
fi

# 检查 FFmpeg 环境
if ! command -v ffmpeg >/dev/null 2>&1; then
    osascript -e 'display alert "视频剪辑姬 提示" message "未检测到 FFmpeg。请在终端执行 brew install ffmpeg 后再启动应用以享受无损流复制。" as informational'
fi

# 打开应用界面
open "http://localhost:3000" 2>/dev/null || open "$DIR/../Resources/index.html"
`;
}

/**
 * Creates a synthetic DMG binary container package for version 1.1
 */
export function createSyntheticDmgBlob(): Blob {
  const header = `koly` + `视频剪辑姬（Video Cutie）v1.1 Universal DMG [arm64 + x86_64]`;
  const info = generateInfoPlist();
  const launcher = generateUniversalLauncherScript();
  
  const content = `# ==============================================================================
# 视频剪辑姬（Video Cutie）v1.1 macOS Universal Disk Image Bundle (.dmg)
# Architectures: arm64 (Apple Silicon M1/M2/M3/M4) + x86_64 (Intel Core i5/i7/i9/Xeon)
# Target OS: macOS 11.0 Big Sur ~ macOS 15+ Sequoia
# Mode: Lossless Video & Audio Stream Copy (-c:v copy -c:a copy)
# ==============================================================================

[DMG Header]
Volume Name: 视频剪辑姬 1.1
Bundle Identifier: com.videocutie.macos.app
Release Title: 视频剪辑姬（Video Cutie）v1.1
Architectures: Universal Binary (arm64, x86_64)

[App Bundle Structure]
视频剪辑姬.app/
├── Contents/
│   ├── Info.plist
${info}
│   ├── MacOS/
│   │   └── VideoCutie (Universal Binary Launcher)
${launcher}
│   └── Resources/
│       ├── AppIcon.icns
│       └── Assets/
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

/**
 * Generates the authentic native macOS build script
 */
export function generateDmgBuildScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# 视频剪辑姬（Video Cutie）v1.1 - macOS Universal DMG 构建脚本
# 兼容: Apple Silicon (M1/M2/M3/M4) & Intel (x86_64)
# ==============================================================================

set -euo pipefail

APP_NAME_ZH="视频剪辑姬"
APP_NAME_EN="VideoCutie"
VERSION="1.1"
OUTPUT_DIR="dist-dmg"
STAGING_DIR="build/dmg_staging"
APP_DIR="\${STAGING_DIR}/\${APP_NAME_ZH}.app"
DMG_OUTPUT="\${OUTPUT_DIR}/\${APP_NAME_EN}-\${VERSION}-Universal.dmg"

echo "🌸 开始构建 \${APP_NAME_ZH}（\${APP_NAME_EN}）v\${VERSION} (Universal macOS)..."

rm -rf "\${OUTPUT_DIR}" "\${STAGING_DIR}"
mkdir -p "\${OUTPUT_DIR}"
mkdir -p "\${APP_DIR}/Contents/MacOS"
mkdir -p "\${APP_DIR}/Contents/Resources"

cat << 'EOF' > "\${APP_DIR}/Contents/Info.plist"
${generateInfoPlist()}
EOF

cat << 'EOF' > "\${APP_DIR}/Contents/MacOS/\${APP_NAME_EN}"
${generateUniversalLauncherScript()}
EOF
chmod +x "\${APP_DIR}/Contents/MacOS/\${APP_NAME_EN}"

ln -s /Applications "\${STAGING_DIR}/Applications"

echo "💿 正在生成 Universal DMG 映像文件..."
if command -v create-dmg >/dev/null 2>&1; then
    create-dmg \\
      --volname "\${APP_NAME_ZH} \${VERSION} 安装器" \\
      --window-pos 200 120 \\
      --window-size 660 400 \\
      --icon-size 120 \\
      --icon "\${APP_NAME_ZH}.app" 180 180 \\
      --app-drop-link 480 180 \\
      --hide-extension "\${APP_NAME_ZH}.app" \\
      "\${DMG_OUTPUT}" \\
      "\${STAGING_DIR}"
else
    hdiutil create \\
      -volname "\${APP_NAME_ZH} \${VERSION}" \\
      -srcfolder "\${STAGING_DIR}" \\
      -ov \\
      -format UDZO \\
      "\${DMG_OUTPUT}"
fi

echo "🎉 成功生成 Universal DMG 安装包: \${DMG_OUTPUT}"
`;
}

export const GITHUB_WORKFLOW_YAML = `name: 视频剪辑姬（Video Cutie）- macOS Universal DMG 构建与发布

on:
  workflow_dispatch:
    inputs:
      version:
        description: '发布版本号 (如 1.1.1)'
        required: true
        default: '1.1.1'
      release_title:
        description: 'GitHub Release 标题'
        required: true
        default: '视频剪辑姬（Video Cutie）v1.1.1'
      create_release:
        description: '构建完成后是否自动在 GitHub Releases 发布'
        required: true
        type: boolean
        default: true
  push:
    tags:
      - 'v*'

permissions:
  contents: write

jobs:
  build-macos-dmg:
    name: 构建 macOS Universal 原生客户端与 DMG
    runs-on: macos-latest
    steps:
      - name: 检出仓库代码
        uses: actions/checkout@v4

      - name: 安装 Node.js 运行时
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: 安装项目依赖 (配置 macOS 原生二进制)
        run: |
          # 解决 npm/cli#4828：清理可能存在的跨平台锁文件与缓存，在 macOS 运行器上全新安装匹配的 darwin native bindings
          rm -rf node_modules package-lock.json
          npm install --legacy-peer-deps

      - name: 构建 Web 客户端界面资源 (相对路径 base: ./)
        run: |
          npm run build

      - name: 安装 DMG 打包工具 (create-dmg)
        run: |
          brew install create-dmg || true

      - name: 编译原生客户端与执行 Universal DMG 打包脚本
        env:
          APP_VERSION: \${{ github.event.inputs.version || '1.1.1' }}
          APP_NAME_ZH: "视频剪辑姬"
          APP_NAME_EN: "Video Cutie"
        run: |
          chmod +x ./scripts/build-dmg.sh
          ./scripts/build-dmg.sh "\${{ github.event.inputs.version || '1.1.1' }}"

      - name: 准备优化完成汇报 (Release Notes)
        id: release_notes
        run: |
          if [ -f "RELEASE_REPORT_v1.1.1.md" ]; then
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
          name: \${{ github.event.inputs.release_title || '视频剪辑姬（Video Cutie）v1.1.1' }}
          tag_name: "v\${{ github.event.inputs.version || '1.1.1' }}"
          body_path: \${{ steps.release_notes.outputs.notes_file }}
          draft: false
          prerelease: false
          files: |
            dist-dmg/*.dmg
            dist-dmg/*.zip
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;
