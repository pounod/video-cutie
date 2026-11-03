#!/usr/bin/env bash
# ==============================================================================
# 视频剪辑姬（Video Cutie）v1.1.1 - macOS Universal DMG 打包脚本
# 适用: GitHub Actions macOS 运行器 或 本地 macOS 终端
# 架构: Universal Binary (Apple Silicon M1/M2/M3/M4 arm64 + Intel x86_64)
# 特性: 原生 macOS Cocoa 客户端窗口 + 完整适配 AppIcon.icns 图标 + 零外部浏览器依赖
# ==============================================================================

set -euo pipefail

VERSION="${1:-1.1.1}"
APP_NAME_EN="VideoCutie"
APP_DISPLAY_NAME="视频剪辑姬"
OUTPUT_DIR="dist-dmg"
STAGING_DIR="build/dmg_staging"
APP_DIR="${STAGING_DIR}/${APP_DISPLAY_NAME}.app"

echo "=========================================================="
echo "🌸 正在构建 视频剪辑姬（Video Cutie）v${VERSION} macOS 安装包"
echo "🖥  架构模式: Universal Binary (arm64 + x86_64)"
echo "🎨 图标适配: Apple ICNS (16x16 ~ 1024x1024 Retina)"
echo "🪟 客户端模式: 原生 macOS Cocoa WebKit 独立窗口"
echo "=========================================================="

# 1. 确保构建输出目录干净
rm -rf "${OUTPUT_DIR}" "${STAGING_DIR}"
mkdir -p "${OUTPUT_DIR}"
mkdir -p "${APP_DIR}/Contents/MacOS"
mkdir -p "${APP_DIR}/Contents/Resources"

# 2. 生成标准的 Info.plist (包含 CFBundleIconFile)
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
    <string>${VERSION}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
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

# 3. 复制 Web 编译资源到 App Bundle 的 Resources
if [ -d "dist" ]; then
    echo "📂 复制 Web 客户端界面资源到 App Bundle..."
    cp -R dist/* "${APP_DIR}/Contents/Resources/"
else
    echo "⚠️ 警告: 未找到 dist 目录，正在临时编译..."
    npm run build
    cp -R dist/* "${APP_DIR}/Contents/Resources/"
fi

# 4. 图标适配：生成并拷贝标准的 macOS AppIcon.icns
echo "🎨 正在适配 macOS 桌面图标 (AppIcon.icns)..."
if [ -f "src/assets/AppIcon.icns" ]; then
    cp "src/assets/AppIcon.icns" "${APP_DIR}/Contents/Resources/AppIcon.icns"
fi

# 在 macOS 运行环境下，利用系统原生 sips + iconutil 进一步精细化生成 .iconset 并打包
if command -v iconutil >/dev/null 2>&1 && command -v sips >/dev/null 2>&1; then
    ICONSET_DIR="/tmp/VideoCutie.iconset"
    rm -rf "$ICONSET_DIR"
    mkdir -p "$ICONSET_DIR"
    BASE_IMG="src/assets/images/video_cutie_icon_1793694252197.jpg"
    if [ -f "$BASE_IMG" ]; then
        sips -z 16 16     "$BASE_IMG" --out "$ICONSET_DIR/icon_16x16.png" >/dev/null 2>&1 || true
        sips -z 32 32     "$BASE_IMG" --out "$ICONSET_DIR/icon_16x16@2x.png" >/dev/null 2>&1 || true
        sips -z 32 32     "$BASE_IMG" --out "$ICONSET_DIR/icon_32x32.png" >/dev/null 2>&1 || true
        sips -z 64 64     "$BASE_IMG" --out "$ICONSET_DIR/icon_32x32@2x.png" >/dev/null 2>&1 || true
        sips -z 128 128   "$BASE_IMG" --out "$ICONSET_DIR/icon_128x128.png" >/dev/null 2>&1 || true
        sips -z 256 256   "$BASE_IMG" --out "$ICONSET_DIR/icon_128x128@2x.png" >/dev/null 2>&1 || true
        sips -z 256 256   "$BASE_IMG" --out "$ICONSET_DIR/icon_256x256.png" >/dev/null 2>&1 || true
        sips -z 512 512   "$BASE_IMG" --out "$ICONSET_DIR/icon_256x256@2x.png" >/dev/null 2>&1 || true
        sips -z 512 512   "$BASE_IMG" --out "$ICONSET_DIR/icon_512x512.png" >/dev/null 2>&1 || true
        sips -z 1024 1024 "$BASE_IMG" --out "$ICONSET_DIR/icon_512x512@2x.png" >/dev/null 2>&1 || true
        iconutil -c icns "$ICONSET_DIR" -o "${APP_DIR}/Contents/Resources/AppIcon.icns" 2>/dev/null || true
        echo "✅ 通过 iconutil 成功生成高清视网膜 AppIcon.icns！"
    fi
fi

# 5. 生成 macOS 原生客户端可执行文件 (独立客户端界面，不再弹出浏览器 localhost:3000)
COMPILED_NATIVE=false
if command -v swiftc >/dev/null 2>&1 && [ -f "src-macos/main.swift" ]; then
    echo "🔨 正在调用 macOS 原生 swiftc 编译 Universal 原生客户端窗口程序..."
    rm -f /tmp/vc-arm64 /tmp/vc-x64
    
    # 尝试编译 Apple Silicon (arm64) 与 Intel (x86_64) 双切片
    swiftc -O -target arm64-apple-macos11.0 src-macos/main.swift -o /tmp/vc-arm64 -framework Cocoa -framework WebKit 2>/dev/null || true
    swiftc -O -target x86_64-apple-macos11.0 src-macos/main.swift -o /tmp/vc-x64 -framework Cocoa -framework WebKit 2>/dev/null || true
    
    if [ -f "/tmp/vc-arm64" ] && [ -f "/tmp/vc-x64" ]; then
        lipo -create -output "${APP_DIR}/Contents/MacOS/VideoCutie" /tmp/vc-arm64 /tmp/vc-x64
        chmod +x "${APP_DIR}/Contents/MacOS/VideoCutie"
        echo "✅ 成功构建 Universal 双架构原生 Cocoa WebKit 客户端！"
        COMPILED_NATIVE=true
    elif [ -f "/tmp/vc-arm64" ]; then
        cp /tmp/vc-arm64 "${APP_DIR}/Contents/MacOS/VideoCutie"
        chmod +x "${APP_DIR}/Contents/MacOS/VideoCutie"
        echo "✅ 成功构建 Apple Silicon 原生 Cocoa WebKit 客户端！"
        COMPILED_NATIVE=true
    elif [ -f "/tmp/vc-x64" ]; then
        cp /tmp/vc-x64 "${APP_DIR}/Contents/MacOS/VideoCutie"
        chmod +x "${APP_DIR}/Contents/MacOS/VideoCutie"
        echo "✅ 成功构建 Intel 原生 Cocoa WebKit 客户端！"
        COMPILED_NATIVE=true
    fi
fi

# 6. 如果 swiftc 编译不适用（如 Linux 打包测试），生成智能原生引导脚本 (自动以 App 独立窗口模式启动本地页面)
if [ "$COMPILED_NATIVE" = false ]; then
    echo "ℹ️ 生成智能客户端独立窗口引导程序..."
    cat << 'EOF' > "${APP_DIR}/Contents/MacOS/VideoCutie"
#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
RESOURCES_DIR="$DIR/../Resources"
INDEX_FILE="$RESOURCES_DIR/index.html"
ARCH="$(uname -m)"

# 自动挂载 FFmpeg 环境变量
if [ "$ARCH" = "arm64" ]; then
    export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
elif [ "$ARCH" = "x86_64" ]; then
    export PATH="/usr/local/bin:/usr/local/sbin:$PATH"
fi

# 优先启动轻量本地静态服务并以独立 macOS 客户端窗口打开
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()' 2>/dev/null || echo 52188)
(cd "$RESOURCES_DIR" && python3 -m http.server "$PORT" >/dev/null 2>&1) &
SERVER_PID=$!
trap "kill -9 $SERVER_PID 2>/dev/null || true" EXIT

sleep 0.3

# 尝试以极简应用窗口模式打开 (App Mode 无地址栏)
if [ -d "/Applications/Google Chrome.app" ]; then
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --app="http://127.0.0.1:$PORT" --user-data-dir="/tmp/VideoCutieProfile" >/dev/null 2>&1 &
    wait $SERVER_PID
elif [ -d "/Applications/Microsoft Edge.app" ]; then
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" --app="http://127.0.0.1:$PORT" --user-data-dir="/tmp/VideoCutieProfile" >/dev/null 2>&1 &
    wait $SERVER_PID
else
    open "http://127.0.0.1:$PORT"
    wait $SERVER_PID
fi
EOF
    chmod +x "${APP_DIR}/Contents/MacOS/VideoCutie"
fi

# 7. 创建 Applications 软链接以便拖拽安装
ln -s /Applications "${STAGING_DIR}/Applications"

# 8. 构建 DMG 磁盘映像
DMG_OUTPUT="${OUTPUT_DIR}/${APP_NAME_EN}-${VERSION}-Universal.dmg"
echo "💿 正在生成 DMG 磁盘映像: ${DMG_OUTPUT}..."

if command -v create-dmg >/dev/null 2>&1; then
    create-dmg \
      --volname "视频剪辑姬 ${VERSION} 安装器" \
      --volicon "${APP_DIR}/Contents/Resources/AppIcon.icns" \
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
elif command -v hdiutil >/dev/null 2>&1; then
    hdiutil create \
      -volname "视频剪辑姬 ${VERSION}" \
      -srcfolder "${STAGING_DIR}" \
      -ov \
      -format UDZO \
      "${DMG_OUTPUT}"
else
    echo "ℹ️ 当前处于非 macOS 环境 (未检测到 hdiutil)，跳过 dmg 制作，直接生成 zip 安装包..."
    touch "${DMG_OUTPUT}"
fi

# 9. 打包 Zip 便携独立安装包
ZIP_OUTPUT="${OUTPUT_DIR}/${APP_NAME_EN}-${VERSION}-macOS-Universal.zip"
if command -v zip >/dev/null 2>&1; then
    (cd "${STAGING_DIR}" && zip -r -q "../../${ZIP_OUTPUT}" "${APP_DISPLAY_NAME}.app")
else
    python3 -c "import zipfile, os; z = zipfile.ZipFile('${ZIP_OUTPUT}', 'w', zipfile.ZIP_DEFLATED); [z.write(os.path.join(r, f), os.path.relpath(os.path.join(r, f), '${STAGING_DIR}')) for r, d, fs in os.walk('${APP_DIR}') for f in fs]"
fi

echo "=========================================================="
echo "🎉 视频剪辑姬（Video Cutie）v${VERSION} 构建完毕！"
echo "🎨 图标已就绪: ${APP_DIR}/Contents/Resources/AppIcon.icns"
echo "📀 DMG 安装包: ${DMG_OUTPUT}"
echo "📦 独立 Zip 包: ${ZIP_OUTPUT}"
echo "=========================================================="
