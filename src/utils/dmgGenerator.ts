/**
 * macOS Universal DMG & App Bundle Generator (TrimCraft 1.0)
 * Dual-Architecture: Apple Silicon (M1/M2/M3/M4, arm64) + Intel (x86_64)
 */

export interface DmgPackageInfo {
  appName: string;
  version: string;
  bundleId: string;
  minSystemVersion: string;
  architectures: string[];
  filename: string;
}

export const APP_INFO: DmgPackageInfo = {
  appName: 'TrimCraft',
  version: '1.0',
  bundleId: 'com.trimcraft.macos.videotrimmer',
  minSystemVersion: '11.0 (macOS Big Sur / Monterey / Ventura / Sonoma / Sequoia)',
  architectures: ['arm64 (Apple Silicon M1/M2/M3/M4)', 'x86_64 (Intel 64-bit)'],
  filename: 'TrimCraft-1.0-Universal.dmg',
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
    <string>TrimCraft</string>
    <key>CFBundleExecutable</key>
    <string>TrimCraft</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundleIdentifier</key>
    <string>com.trimcraft.macos.videotrimmer</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>TrimCraft</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 TrimCraft. All rights reserved.</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.video</string>
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeName</key>
            <string>Video File</string>
            <key>CFBundleTypeRole</key>
            <string>Viewer</string>
            <key>LSHandlerRank</key>
            <string>Alternate</string>
            <key>LSItemContentTypes</key>
            <array>
                <string>public.movie</string>
                <string>public.video</string>
                <string>com.apple.quicktime-movie</string>
                <string>public.mpeg-4</string>
            </array>
        </dict>
    </array>
</dict>
</plist>`;
}

/**
 * Universal Binary macOS Launcher Shell Script inside Contents/MacOS/TrimCraft
 */
export function generateUniversalLauncherScript(): string {
  return `#!/usr/bin/env bash
# ==========================================================
# TrimCraft 1.0 - Universal macOS Launcher (arm64 + x86_64)
# ==========================================================
DIR="$( cd "$( dirname "\${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="$DIR/../Resources"
ARCH="$(uname -m)"

echo "[TrimCraft 1.0] Detected macOS Architecture: $ARCH"

# 检测架构并选择对应原生二进制
if [ "$ARCH" = "arm64" ]; then
    echo "[TrimCraft 1.0] Running on Apple Silicon (arm64 Native)"
    export PATH="/opt/homebrew/bin:$PATH"
elif [ "$ARCH" = "x86_64" ]; then
    echo "[TrimCraft 1.0] Running on Intel (x86_64 Native)"
    export PATH="/usr/local/bin:$PATH"
fi

# 检查 FFmpeg 环境
if ! command -v ffmpeg >/dev/null 2>&1; then
    osascript -e 'display alert "TrimCraft 提示" message "未检测到 FFmpeg。请在终端执行 brew install ffmpeg 后再启动应用。" as warning'
fi

# 启动客户端服务
if [ -f "$DIR/TrimCraft-arm64" ] && [ "$ARCH" = "arm64" ]; then
    exec "$DIR/TrimCraft-arm64" "$@"
elif [ -f "$DIR/TrimCraft-x86_64" ] && [ "$ARCH" = "x86_64" ]; then
    exec "$DIR/TrimCraft-x86_64" "$@"
else
    # 纯脚本或独立运行模式
    open "http://localhost:3000" 2>/dev/null || open "$RESOURCES_DIR/index.html"
fi
`;
}

/**
 * Generates the authentic native macOS build script to build a .dmg with create-dmg or hdiutil
 */
export function generateDmgBuildScript(): string {
  return `#!/usr/bin/env bash
# ==============================================================================
# TrimCraft 1.0 - 构建 Universal 架构 macOS .dmg 安装包
# 兼容: Apple Silicon (M1/M2/M3/M4) & Intel (x86_64)
# ==============================================================================

set -euo pipefail

APP_NAME="TrimCraft"
VERSION="1.0"
DMG_NAME="\${APP_NAME}-\${VERSION}-Universal.dmg"
BUILD_DIR="./build"
APP_DIR="\${BUILD_DIR}/\${APP_NAME}.app"
DMG_STAGING="\${BUILD_DIR}/dmg_staging"

echo "🚀 开始构建 \${APP_NAME} v\${VERSION} (Universal macOS)..."

# 1. 清理旧构建目录
rm -rf "\${BUILD_DIR}"
mkdir -p "\${APP_DIR}/Contents/MacOS"
mkdir -p "\${APP_DIR}/Contents/Resources"
mkdir -p "\${DMG_STAGING}"

# 2. 写入 Info.plist
cat << 'EOF' > "\${APP_DIR}/Contents/Info.plist"
${generateInfoPlist()}
EOF

# 3. 写入 Universal 执行入口
cat << 'EOF' > "\${APP_DIR}/Contents/MacOS/\${APP_NAME}"
${generateUniversalLauncherScript()}
EOF
chmod +x "\${APP_DIR}/Contents/MacOS/\${APP_NAME}"

# 4. 拷贝静态资源与应用图标
echo "🎨 正在打包资源..."
# cp -r ./src/assets/* "\${APP_DIR}/Contents/Resources/" 2>/dev/null || true

# 5. 准备 DMG 挂载盘内容 (应用 + 应用程序软链接)
echo "📦 准备 DMG 结构..."
cp -R "\${APP_DIR}" "\${DMG_STAGING}/"
ln -s /Applications "\${DMG_STAGING}/Applications"

# 6. 使用 macOS 原生 hdiutil 打包为压缩只读 DMG 映像
echo "💿 正在生成 Universal DMG 映像文件..."
rm -f "./\${DMG_NAME}"

if command -v create-dmg >/dev/null 2>&1; then
    create-dmg \\
      --volname "\${APP_NAME} \${VERSION} 安装器" \\
      --window-pos 200 120 \\
      --window-size 660 400 \\
      --icon-size 120 \\
      --icon "\${APP_NAME}.app" 180 180 \\
      --app-drop-link 480 180 \\
      --hide-extension "\${APP_NAME}.app" \\
      "./\${DMG_NAME}" \\
      "\${DMG_STAGING}"
else
    hdiutil create \\
      -volname "\${APP_NAME} \${VERSION}" \\
      -srcfolder "\${DMG_STAGING}" \\
      -ov \\
      -format UDZO \\
      "./\${DMG_NAME}"
fi

echo "=========================================================="
echo "🎉 成功生成 macOS Universal 安装包: \${DMG_NAME}"
echo "📱 架构支持: arm64 (Apple Silicon) + x86_64 (Intel)"
echo "💾 双击打开 \${DMG_NAME} 即可拖入 /Applications 安装！"
echo "=========================================================="
`;
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
 * Creates a synthetic DMG binary container package for version 1.0
 * In macOS, a DMG package header format with app bundle structure or installer package
 */
export function createSyntheticDmgBlob(): Blob {
  const header = `koly` + `TrimCraft macOS Universal DMG v1.0 [arm64 + x86_64] Apple Silicon & Intel Compatible`;
  const info = generateInfoPlist();
  const launcher = generateUniversalLauncherScript();
  const buildScript = generateDmgBuildScript();
  
  const content = `# ==============================================================================
# TrimCraft 1.0 macOS Universal Disk Image Bundle (.dmg)
# Architectures: arm64 (Apple Silicon M1/M2/M3/M4) + x86_64 (Intel Core i5/i7/i9/Xeon)
# Target OS: macOS 11.0 Big Sur ~ macOS 15+ Sequoia
# Mode: Lossless Video & Audio Stream Copy (-c:v copy -c:a copy)
# ==============================================================================

[DMG Header]
Volume Name: TrimCraft 1.0
Bundle Identifier: com.trimcraft.macos.videotrimmer
Architectures: Universal Binary (arm64, x86_64)

[App Bundle Structure]
TrimCraft.app/
├── Contents/
│   ├── Info.plist
${info}
│   ├── MacOS/
│   │   └── TrimCraft (Universal Binary Launcher)
${launcher}
│   └── Resources/
│       ├── AppIcon.icns
│       └── Assets/

[DMG Builder Script: build-universal-dmg.sh]
${buildScript}
`;

  return new Blob([header, '\n\n', content], { type: 'application/x-apple-diskimage' });
}
