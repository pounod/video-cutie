#!/usr/bin/env bash
# ==============================================================================
# 视频剪辑姬（Video Cutie）v1.1 - macOS Universal DMG 打包脚本
# 适用: GitHub Actions macOS 运行器 或 本地 macOS 终端
# 架构: Universal (Apple Silicon M1/M2/M3/M4 arm64 + Intel x86_64)
# ==============================================================================

set -euo pipefail

VERSION="${1:-1.1}"
APP_NAME_EN="VideoCutie"
APP_DISPLAY_NAME="视频剪辑姬"
OUTPUT_DIR="dist-dmg"
STAGING_DIR="build/dmg_staging"
APP_DIR="${STAGING_DIR}/${APP_DISPLAY_NAME}.app"

echo "=========================================================="
echo "🌸 正在构建 视频剪辑姬（Video Cutie）v${VERSION} macOS 安装包"
echo "🖥  架构模式: Universal Binary (arm64 + x86_64)"
echo "=========================================================="

# 1. 确保构建输出目录干净
rm -rf "${OUTPUT_DIR}" "${STAGING_DIR}"
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${APP_DIR}/Contents/MacOS"
mkdir -p "${APP_DIR}/Contents/Resources"

# 2. 生成 Info.plist
cat << EOF > "${APP_DIR}/Contents/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
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
    <key>CFBundleIdentifier</key>
    <string>com.videocutie.macos.app</string>
    <key>CFBundleInfoDictionaryVersion</key>
    <string>6.0</string>
    <key>CFBundleName</key>
    <string>VideoCutie</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>11.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>NSHumanReadableCopyright</key>
    <string>Copyright © 2026 视频剪辑姬 (Video Cutie). All rights reserved.</string>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.video</string>
</dict>
</plist>
EOF

# 3. 生成 Universal 兼容启动脚本
cat << 'EOF' > "${APP_DIR}/Contents/MacOS/VideoCutie"
#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ARCH="$(uname -m)"

# 自动配置对应芯片架构的 FFmpeg 环境变量
if [ "$ARCH" = "arm64" ]; then
    export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
elif [ "$ARCH" = "x86_64" ]; then
    export PATH="/usr/local/bin:/usr/local/sbin:$PATH"
fi

# 检测 FFmpeg 安装状态
if ! command -v ffmpeg >/dev/null 2>&1; then
    osascript -e 'display alert "视频剪辑姬 提示" message "未检测到终端 FFmpeg。请运行 brew install ffmpeg 安装以启用极速无损流复制。" as informational'
fi

# 启动本地服务或桌面容器
if command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" 2>/dev/null || open "$DIR/../Resources/index.html"
fi
EOF

chmod +x "${APP_DIR}/Contents/MacOS/VideoCutie"

# 4. 拷贝静态页面产物至资源目录
if [ -d "dist" ]; then
    echo "📂 复制 Web 编译资源到 App Bundle..."
    cp -R dist/* "${APP_DIR}/Contents/Resources/" 2>/dev/null || true
fi

# 5. 复制图标资源
if [ -f "src/assets/images/video_cutie_icon_1793694252197.jpg" ]; then
    cp "src/assets/images/video_cutie_icon_1793694252197.jpg" "${APP_DIR}/Contents/Resources/AppIcon.jpg"
fi

# 6. 创建 Applications 软链接以便拖拽安装
ln -s /Applications "${STAGING_DIR}/Applications"

# 7. 构建 DMG 文件
DMG_OUTPUT="${OUTPUT_DIR}/${APP_NAME_EN}-${VERSION}-Universal.dmg"
echo "💿 正在生成 DMG 磁盘映像: ${DMG_OUTPUT}..."

if command -v create-dmg >/dev/null 2>&1; then
    create-dmg \
      --volname "视频剪辑姬 ${VERSION} 安装器" \
      --window-pos 200 120 \
      --window-size 660 400 \
      --icon-size 120 \
      --icon "${APP_DISPLAY_NAME}.app" 180 180 \
      --app-drop-link 480 180 \
      --hide-extension "${APP_DISPLAY_NAME}.app" \
      "${DMG_OUTPUT}" \
      "${STAGING_DIR}" || {
        echo "⚠️ create-dmg 执行告警，回退至 hdiutil 原生模式..."
        hdiutil create -volname "视频剪辑姬 ${VERSION}" -srcfolder "${STAGING_DIR}" -ov -format UDZO "${DMG_OUTPUT}"
      }
else
    hdiutil create \
      -volname "视频剪辑姬 ${VERSION}" \
      -srcfolder "${STAGING_DIR}" \
      -ov \
      -format UDZO \
      "${DMG_OUTPUT}"
fi

# 8. 打包 Zip 便携独立安装包
ZIP_OUTPUT="${OUTPUT_DIR}/${APP_NAME_EN}-${VERSION}-macOS-Universal.zip"
echo "📦 正在压缩独立免安装包: ${ZIP_OUTPUT}..."
(cd "${STAGING_DIR}" && zip -r -q "../../${ZIP_OUTPUT}" "${APP_DISPLAY_NAME}.app")

echo "=========================================================="
echo "🎉 视频剪辑姬（Video Cutie）v${VERSION} 构建完毕！"
echo "📀 DMG 安装包: ${DMG_OUTPUT}"
echo "📦 独立 Zip 包: ${ZIP_OUTPUT}"
echo "=========================================================="
